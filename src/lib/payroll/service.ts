import { createClient } from "@/lib/supabase/server";
import { PayrollContext, PayFrequency } from "./types";
import Decimal from "decimal.js";

// Note: This service currently stubs out the actual Supabase database fetches.
// In Phase 8, when we run the payroll, we will implement the full SQL queries 
export async function loadPayrollContext(
  employeeId: string, 
  periodStart: string,
  periodEnd: string,
  payFrequency: PayFrequency
): Promise<PayrollContext> {
  const supabase = await createClient();

  // 1. Fetch or resolve the Payroll Period ID
  const { data: dbPeriod } = await supabase
    .from('payroll_periods')
    .select('id, period_start, period_end, pay_frequency')
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .eq('pay_frequency', payFrequency)
    .single();

  let payrollPeriodId = "preview-period-id";
  if (dbPeriod) {
    payrollPeriodId = dbPeriod.id;
  } else {
    // If we are strictly previewing and no period exists, we still need to look up timesheets. 
    // Timesheets are bound to a period ID. So if the period doesn't exist, we can't have timesheets!
    throw new Error(`Payroll period not found. Timesheets must be generated and approved for this period first.`);
  }

  const periodData = {
    id: payrollPeriodId,
    period_start: periodStart,
    period_end: periodEnd,
    pay_frequency: payFrequency,
  };

  // Fetch Employee
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('*, employee_compensation_history(*)')
    .eq('id', employeeId)
    .single();

  if (empError || !employee) throw new Error("Failed to load employee.");

  // Get active compensation for the period
  // A compensation is active if its effective_from is <= period_end 
  // and (effective_to is null or effective_to >= period_start)
  const activeComp = employee.employee_compensation_history
    .filter((c: any) => {
      const from = new Date(c.effective_from);
      const to = c.effective_to ? new Date(c.effective_to) : null;
      const periodEnd = new Date(periodData.period_end);
      const periodStart = new Date(periodData.period_start);
      return from <= periodEnd && (!to || to >= periodStart);
    })
    .sort((a: any, b: any) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime())[0];

  if (!activeComp) {
    throw new Error(`No active compensation found for employee ${employeeId} during this period.`);
  }

  const empData = {
    id: employee.id,
    first_name: employee.first_name,
    last_name: employee.last_name,
    employment_type: employee.employment_type as any,
    history: [{
      id: activeComp.id,
      effective_from: activeComp.effective_from,
      effective_to: activeComp.effective_to,
      salary_type: activeComp.salary_type,
      basic_salary: new Decimal(activeComp.basic_salary),
      daily_rate: new Decimal(activeComp.daily_rate || 0),
    }]
  };

  // Fetch Tax Config
  const { data: taxTables } = await supabase
    .from('tax_tables')
    .select('*, tax_brackets(*)')
    .eq('is_active', true)
    .lte('effective_from', periodData.period_end)
    .order('effective_from', { ascending: false })
    .limit(1);

  let taxConfig = null;
  if (taxTables && taxTables.length > 0) {
    taxConfig = {
      id: taxTables[0].id,
      name: taxTables[0].name,
      brackets: taxTables[0].tax_brackets.map((b: any) => ({
        ...b,
        minimum_income: new Decimal(b.minimum_income),
        maximum_income: b.maximum_income ? new Decimal(b.maximum_income) : null,
        base_tax: new Decimal(b.base_tax),
        excess_rate: new Decimal(b.excess_rate)
      }))
    };
  }

  // Fetch SSS Config (from government_contribution_tables)
  const { data: sssTables } = await supabase
    .from('government_contribution_tables')
    .select('*, government_contribution_brackets(*)')
    .eq('contribution_type', 'SSS')
    .eq('is_active', true)
    .lte('effective_from', periodData.period_end)
    .order('effective_from', { ascending: false })
    .limit(1);

  let sssConfig = null;
  if (sssTables && sssTables.length > 0) {
    const sssTable = sssTables[0];
    sssConfig = {
      id: sssTable.id,
      brackets: sssTable.government_contribution_brackets.map((b: any) => ({
        id: b.id,
        minimum_compensation: new Decimal(b.salary_min),
        maximum_compensation: b.salary_max ? new Decimal(b.salary_max) : null,
        monthly_salary_credit: new Decimal(b.monthly_salary_credit ?? b.salary_min),
        regular_ss_employee: new Decimal(b.regular_ss_employee ?? b.employee_amount ?? 0),
        regular_ss_employer: new Decimal(b.regular_ss_employer ?? b.employer_amount ?? 0),
        mpf_employee: new Decimal(b.mpf_employee ?? 0),
        mpf_employer: new Decimal(b.mpf_employer ?? 0),
        ec_employer: new Decimal(b.ec_employer ?? 0),
      })).sort((a: any, b: any) => a.minimum_compensation.comparedTo(b.minimum_compensation))
    };
  }

  // Fetch PhilHealth Config (from dedicated philhealth_configs table)
  const { data: phConfigs } = await supabase
    .from('philhealth_configs')
    .select('*')
    .eq('is_active', true)
    .lte('effective_from', periodData.period_end)
    .order('effective_from', { ascending: false })
    .limit(1);

  let philhealthConfig = null;
  if (phConfigs && phConfigs.length > 0) {
    const ph = phConfigs[0];
    philhealthConfig = {
      id: ph.id,
      premium_rate: new Decimal(ph.premium_rate),
      floor_mbs: new Decimal(ph.floor_mbs),
      ceiling_mbs: new Decimal(ph.ceiling_mbs),
    };
  }

  // Fetch Pag-IBIG Config (from dedicated pagibig_configs table)
  const { data: pagibigConfigs } = await supabase
    .from('pagibig_configs')
    .select('*')
    .eq('is_active', true)
    .lte('effective_from', periodData.period_end)
    .order('effective_from', { ascending: false })
    .limit(1);

  let pagibigConfig = null;
  if (pagibigConfigs && pagibigConfigs.length > 0) {
    const pag = pagibigConfigs[0];
    pagibigConfig = {
      id: pag.id,
      employee_rate_low: new Decimal(pag.employee_rate_low),
      employee_rate_high: new Decimal(pag.employee_rate_high),
      salary_threshold: new Decimal(pag.salary_threshold),
      employer_rate: new Decimal(pag.employer_rate),
      max_compensation: new Decimal(pag.max_compensation),
    };
  }

  // Fetch Approved Timesheet
  const { data: timesheetData } = await supabase
    .from('timesheets')
    .select('*, timesheet_details(*)')
    .eq('employee_id', employeeId)
    .eq('payroll_period_id', payrollPeriodId)
    .single();

  if (!timesheetData) {
    throw new Error(`No timesheet found for ${empData.first_name} ${empData.last_name} during this period.`);
  }
  if (timesheetData.status !== 'Approved') {
    throw new Error(`Timesheet for ${empData.first_name} ${empData.last_name} is ${timesheetData.status}. Must be Approved.`);
  }
  if (timesheetData.is_stale) {
    throw new Error(`Timesheet for ${empData.first_name} ${empData.last_name} is Stale. Attendance was modified after generation.`);
  }
  if (Number(timesheetData.missing_records_count) > 0) {
    throw new Error(`Timesheet for ${empData.first_name} ${empData.last_name} has ${timesheetData.missing_records_count} unresolved missing records.`);
  }

  const timesheet = {
    id: timesheetData.id,
    employee_id: timesheetData.employee_id,
    period_start: timesheetData.period_start,
    period_end: timesheetData.period_end,
    total_regular_hours: new Decimal(timesheetData.total_regular_hours || 0),
    total_recorded_ot_hours: new Decimal(timesheetData.total_recorded_ot_hours || 0),
    total_payable_ot_hours: new Decimal(timesheetData.total_payable_ot_hours || 0),
    total_recorded_ut_hours: new Decimal(timesheetData.total_recorded_ut_hours || 0),
    total_payable_ut_hours: new Decimal(timesheetData.total_payable_ut_hours || 0),
    absent_days: new Decimal(timesheetData.absent_days || 0),
    status: timesheetData.status,
    details: timesheetData.timesheet_details?.map((d: any) => ({
      id: d.id,
      timesheet_id: d.timesheet_id,
      date: d.date,
      day_type: d.day_type,
      scheduled_hours: new Decimal(d.scheduled_hours || 0),
      regular_hours: new Decimal(d.regular_hours || 0),
      recorded_ot_hours: new Decimal(d.recorded_ot_hours || 0),
      approved_ot_hours: new Decimal(d.approved_ot_hours || 0),
      payable_ot_hours: new Decimal(d.payable_ot_hours || 0),
      recorded_ut_hours: new Decimal(d.recorded_ut_hours || 0),
      excused_ut_hours: new Decimal(d.excused_ut_hours || 0),
      payable_ut_hours: new Decimal(d.payable_ut_hours || 0),
    })) || []
  };

  // Fetch Statutory Applicability
  const { data: applicabilityData } = await supabase
    .from('employee_statutory_profiles')
    .select('sss_applicable, philhealth_applicable, pagibig_applicable')
    .eq('employee_id', employeeId)
    .lte('effective_from', periodData.period_end)
    .or(`effective_to.is.null,effective_to.gte.${periodData.period_start}`)
    .order('effective_from', { ascending: false })
    .limit(1)
    .single();

  const statutoryApplicability = {
    sss: applicabilityData?.sss_applicable ?? true,
    philhealth: applicabilityData?.philhealth_applicable ?? true,
    pagibig: applicabilityData?.pagibig_applicable ?? true
  };

  // Fetch Active Work Policy
  const { data: positionsData } = await supabase.from('positions').select('default_work_policy_id').eq('title', employee.positions?.title || '').single() || { data: null };
  const { data: specificPolicies } = await supabase.from('employee_work_policies').select('*, work_policies(*)').eq('employee_id', employeeId);
  
  let activePolicy = null;
  if (specificPolicies && specificPolicies.length > 0) {
    const specific = specificPolicies.find((ewp: any) => !ewp.effective_to || new Date(ewp.effective_to) >= new Date(periodData.period_start));
    if (specific) activePolicy = specific.work_policies;
  }
  
  if (!activePolicy && positionsData?.default_work_policy_id) {
    const { data: wp } = await supabase.from('work_policies').select('*').eq('id', positionsData.default_work_policy_id).single();
    if (wp) activePolicy = wp;
  }
  
  if (!activePolicy) {
    // Fallback to company default
    const { data: cwps } = await supabase.from('work_policies').select('*').eq('is_company_default', true).limit(1);
    if (cwps && cwps.length > 0) activePolicy = cwps[0];
  }

  return {
    employee: empData,
    period: periodData,
    attendance: [], // Raw attendance is no longer used by the engine for basic calculations
    timesheet: timesheet,
    leaves: [],
    holidays: [],
    adjustments: [], // No manual adjustments initially
    overrides: [],
    taxConfig,
    sssConfig,
    philhealthConfig,
    pagibigConfig,
    activePolicy,
    statutoryApplicability
  };
}

export async function finalizePayrollCalculation(
  payrollRunId: string, 
  results: any[]
): Promise<void> {
  // STUB: This function will use a PostgreSQL RPC or sequential atomic transaction
  throw new Error("finalizePayrollCalculation is not fully implemented yet.");
}
