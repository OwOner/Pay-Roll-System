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

  const periodData = {
    id: "preview-period-id",
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

  if (!taxTables || taxTables.length === 0) throw new Error("No active tax table found.");
  
  const taxConfig = {
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

  // Fetch Gov Configs
  const { data: govTables } = await supabase
    .from('government_contribution_tables')
    .select('*, government_contribution_brackets(*)')
    .eq('is_active', true)
    .lte('effective_from', periodData.period_end)
    .order('effective_from', { ascending: false });

  const sssTable = govTables?.find(t => t.contribution_type === 'SSS');
  const phTable = govTables?.find(t => t.contribution_type === 'PhilHealth');
  const pagibigTable = govTables?.find(t => t.contribution_type === 'Pag-IBIG');

  if (!sssTable || !phTable || !pagibigTable) {
    throw new Error("Missing active statutory configurations.");
  }

  const sssConfig = {
    id: sssTable.id,
    brackets: sssTable.government_contribution_brackets.map((b: any) => ({
      id: b.id,
      minimum_compensation: new Decimal(b.salary_min),
      maximum_compensation: b.salary_max ? new Decimal(b.salary_max) : null,
      monthly_salary_credit: new Decimal(b.salary_min), // Using salary_min as MSC for now
      regular_ss_employee: new Decimal(b.employee_amount),
      regular_ss_employer: new Decimal(b.employer_amount),
      mpf_employee: new Decimal(0),
      mpf_employer: new Decimal(0),
      ec_employer: new Decimal(0)
    }))
  };

  // Philhealth is mapped by extracting rates from the brackets
  const phBrackets = phTable.government_contribution_brackets;
  const phRateBracket = phBrackets.find((b: any) => b.employee_rate > 0);
  const philhealthConfig = {
    id: phTable.id,
    premium_rate: new Decimal(phRateBracket ? phRateBracket.employee_rate * 2 : 0.05), // Total premium rate
    floor_mbs: new Decimal(10000), // Hardcoded fallbacks if not found correctly
    ceiling_mbs: new Decimal(100000)
  };

  const pagibigConfig = {
    id: pagibigTable.id,
    employee_rate_below_1500: new Decimal(0.01),
    employee_rate_above_1500: new Decimal(0.02),
    employer_rate: new Decimal(0.02),
    max_compensation: new Decimal(10000)
  };

  return {
    employee: empData,
    period: periodData,
    attendance: [], // We don't have attendance module yet, so empty arrays
    leaves: [],
    holidays: [],
    adjustments: [], // No manual adjustments initially
    overrides: [],
    taxConfig,
    sssConfig,
    philhealthConfig,
    pagibigConfig
  };
}

export async function finalizePayrollCalculation(
  payrollRunId: string, 
  results: any[]
): Promise<void> {
  // STUB: This function will use a PostgreSQL RPC or sequential atomic transaction
  throw new Error("finalizePayrollCalculation is not fully implemented yet.");
}
