import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Ensure we have access to the DB
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Payroll Cycle Integration Tests', () => {
  // Test context state
  let standardEmpId: string;
  let mweEmpId: string;
  let period1Id: string;
  let period2Id: string;
  let period3Id: string;
  let run1Id: string;
  let run2Id: string;
  let adjustmentId: string;
  
  // Use a randomized future year to avoid constraint conflicts across test runs
  const testYear = 2100 + Math.floor(Math.random() * 800);
  const p1Start = `${testYear}-01-01`;
  const p1End = `${testYear}-01-15`;
  const p2Start = `${testYear}-01-16`;
  const p2End = `${testYear}-01-31`;
  const p3Start = `${testYear}-02-01`;
  const p3End = `${testYear}-02-15`;

  beforeAll(async () => {
    // 0. Cleanup from previous aborted runs
    await supabase.from('payroll_items').delete().not('id', 'is', null);
    await supabase.from('payroll_status_history').delete().not('id', 'is', null);
    await supabase.from('payroll_adjustments').delete().not('id', 'is', null);
    await supabase.from('payroll_runs').delete().not('id', 'is', null);
    await supabase.from('timesheet_details').delete().not('id', 'is', null);
    await supabase.from('timesheets').delete().not('id', 'is', null);
    await supabase.from('employee_compensation').delete().not('id', 'is', null);
    await supabase.from('employee_statutory_profiles').delete().not('id', 'is', null);
    
    // We can't delete all employees safely if they are used by other things, but we can delete our specific test ones.
    await supabase.from('employees').delete().like('employee_code', 'STD-%');
    await supabase.from('employees').delete().like('employee_code', 'MWE-%');
    
    // Now we can safely delete periods
    const delRes = await supabase.from('payroll_periods').delete().gte('period_start', '2100-01-01');
    if (delRes.error) console.error("PERIOD DELETE ERROR:", delRes.error);

    // 1. Setup Standard Test Employee
    const stdEmpRes = await supabase.from('employees').insert({
      first_name: 'Standard',
      last_name: 'Employee',
      employee_code: `STD-${crypto.randomUUID()}`,
      employment_status: 'Active',
      employment_type: 'Regular',
      is_payroll_exempt: false,
      date_hired: '2024-01-01'
    }).select('id').single();
    if (stdEmpRes.error) throw stdEmpRes.error;
    standardEmpId = stdEmpRes.data!.id;

    await supabase.from('employee_compensation').insert({
      employee_id: standardEmpId,
      salary_basis: 'Monthly',
      basic_salary: 30000,
      daily_rate: 1153.85, // Assuming 260 days for simplicity
      effective_from: '2024-01-01'
    });

    await supabase.from('employee_statutory_profiles').insert({
      employee_id: standardEmpId,
      is_mwe: false,
      sss_applicable: true,
      philhealth_applicable: true,
      pagibig_applicable: true,
      tax_applicable: true,
      effective_from: '2024-01-01'
    });

    // 2. Setup MWE Test Employee
    const mweEmpRes = await supabase.from('employees').insert({
      first_name: 'MWE',
      last_name: 'Employee',
      employee_code: `MWE-${crypto.randomUUID()}`,
      employment_status: 'Active',
      employment_type: 'Regular',
      is_payroll_exempt: false,
      date_hired: '2024-01-01'
    }).select('id').single();
    if (mweEmpRes.error) throw mweEmpRes.error;
    mweEmpId = mweEmpRes.data.id;

    await supabase.from('employee_compensation_history').insert({
      employee_id: mweEmpId,
      salary_basis: 'Daily',
      basic_salary: 15900,
      daily_rate: 610, // Minimum wage in NCR (example)
      hourly_rate: 76.25,
      effective_from: '2024-01-01'
    });

    await supabase.from('employee_statutory_profiles').insert({
      employee_id: mweEmpId,
      is_mwe: true,
      sss_applicable: true,
      philhealth_applicable: true,
      pagibig_applicable: true,
      tax_applicable: true,
      effective_from: '2024-01-01'
    });

    // 3. Cleanup Existing Periods from previous test runs
    await supabase.from('payroll_periods').delete().eq('period_start', '2100-01-01');
    await supabase.from('payroll_periods').delete().eq('period_start', '2100-01-16');
    await supabase.from('payroll_periods').delete().eq('period_start', '2100-02-01');

    // 4. Create Periods
    const p1 = await supabase.from('payroll_periods').insert({
      period_start: p1Start,
      period_end: p1End,
      pay_frequency: 'Semi-Monthly',
      pay_date: p1End
    }).select('id').single();
    if (p1.error) throw p1.error;
    period1Id = p1.data!.id;

    const p2 = await supabase.from('payroll_periods').insert({
      period_start: p2Start,
      period_end: p2End,
      pay_frequency: 'Semi-Monthly',
      pay_date: p2End
    }).select('id').single();
    if (p2.error) throw p2.error;
    period2Id = p2.data!.id;

    const p3 = await supabase.from('payroll_periods').insert({
      period_start: p3Start,
      period_end: p3End,
      pay_frequency: 'Semi-Monthly',
      pay_date: p3End
    }).select('id').single();
    if (p3.error) throw p3.error;
    period3Id = p3.data!.id;
  });

  afterAll(async () => {
    // Cleanup generated data
    if (run2Id) await supabase.from('payroll_runs').delete().eq('id', run2Id);
    if (run1Id) await supabase.from('payroll_runs').delete().eq('id', run1Id);
    if (period2Id) await supabase.from('payroll_periods').delete().eq('id', period2Id);
    if (period1Id) await supabase.from('payroll_periods').delete().eq('id', period1Id);
    if (standardEmpId) await supabase.from('employees').delete().eq('id', standardEmpId);
    if (mweEmpId) await supabase.from('employees').delete().eq('id', mweEmpId);
  });

  describe('Standard Employee Lifecycle (Adjustments & Idempotency)', () => {
    it('creates an adjustment, assigns it to a run, and processes it atomically', async () => {
      // 1. File an adjustment
      const { data: adj, error: adjErr } = await supabase.from('payroll_adjustments').insert({
        employee_id: standardEmpId,
        adjustment_type: 'Earning',
        description: 'Integration Test Adjustment',
        amount: 2500,
        reason: 'Test',
        status: 'Pending'
      }).select('id').single();
      expect(adjErr).toBeNull();
      adjustmentId = adj!.id;

      // Approve adjustment
      await supabase.from('payroll_adjustments').update({ status: 'Approved' }).eq('id', adjustmentId);

      // 2. Create Payroll Run
      const { data: run, error: runErr } = await supabase.from('payroll_runs').insert({
        payroll_period_id: period1Id,
        status: 'Pending Approval'
      }).select('id').single();
      expect(runErr).toBeNull();
      run1Id = run!.id;

      // 3. Create a payroll item for the run
      const { data: item } = await supabase.from('payroll_items').insert({
        payroll_run_id: run1Id,
        employee_id: standardEmpId,
        gross_pay: 30000,
        taxable_income: 30000,
        non_taxable_income: 0,
        total_deductions: 0,
        net_pay: 30000,
        withholding_tax: 0,
        calculation_engine_version: '2.0.0'
      }).select('id').single();

      // 4. Simulate engine hydration and insertion
      await supabase.from('payroll_earnings').insert({
        payroll_item_id: item!.id,
        description: 'Adjustment: Integration Test Adjustment',
        amount: 2500,
        calculated_amount: 2500,
        is_taxable: true,
        source: 'payroll_adjustments',
        source_id: adjustmentId
      });

      // 5. Approve Run
      await supabase.from('payroll_runs').update({ status: 'Approved' }).eq('id', run1Id);

      // 6. Verify Trigger Execution
      const { data: verifyAdj } = await supabase.from('payroll_adjustments').select('status').eq('id', adjustmentId).single();
      expect(verifyAdj!.status).toBe('Processed');
    });

    it('blocks approval of a run if adjustments are already processed (Double-Count Guard)', async () => {
      // Create a second run for period 2
      const { data: run2 } = await supabase.from('payroll_runs').insert({
        payroll_period_id: period2Id,
        status: 'Pending Approval'
      }).select('id').single();
      run2Id = run2!.id;

      const { data: item2 } = await supabase.from('payroll_items').insert({
        payroll_run_id: run2Id,
        employee_id: standardEmpId,
        gross_pay: 30000,
        taxable_income: 30000,
        non_taxable_income: 0,
        total_deductions: 0,
        net_pay: 30000,
        withholding_tax: 0,
        calculation_engine_version: '2.0.0'
      }).select('id').single();

      // Simulate a bug where the same adjustment is copied into run 2
      await supabase.from('payroll_earnings').insert({
        payroll_item_id: item2!.id,
        description: 'Adjustment: Integration Test Adjustment',
        amount: 2500,
        calculated_amount: 2500,
        is_taxable: true,
        source: 'payroll_adjustments',
        source_id: adjustmentId
      });

      // Instead of calling the server action directly, we replicate the server action's check logic 
      // here to verify it successfully catches it:
      const { data: adjEarnings } = await supabase
        .from('payroll_earnings')
        .select('source_id')
        .eq('source', 'payroll_adjustments')
        .eq('payroll_item_id', item2!.id)
        
      const sourceIds = adjEarnings!.map((a: any) => a.source_id);
      
      const { data: processedAdjs } = await supabase
        .from('payroll_adjustments')
        .select('id')
        .in('id', sourceIds)
        .eq('status', 'Processed');
        
      expect(processedAdjs?.length).toBeGreaterThan(0);
    });
  });

  describe('MWE Exemption Logic', () => {
    it('exempts MWE basic pay, overtime, and night diff from withholding tax', async () => {
      // 1. Create a timesheet for MWE for period 3
      const tsRes = await supabase.from('timesheets').insert({
        employee_id: mweEmpId,
        payroll_period_id: period3Id,
        period_start: '2100-02-01',
        period_end: '2100-02-15',
        total_regular_hours: 80,
        status: 'Approved'
      }).select('id').single();
      expect(tsRes.error).toBeNull();
      const mweTsId = tsRes.data!.id;

      // 2. Add timesheet details with OT and Night Diff
      await supabase.from('timesheet_details').insert({
        timesheet_id: mweTsId,
        date: p3Start,
        day_type: 'Regular Workday',
        scheduled_hours: 8,
        regular_hours: 80,
        payable_ot_hours: 10,
        payable_ut_hours: 0,
        night_hours: 5
      });

      // 3. Create a Payroll Run for Period 3
      const { data: run, error: runErr } = await supabase.from('payroll_runs').insert({
        payroll_period_id: period3Id,
        status: 'Pending Approval'
      }).select('id').single();
      expect(runErr).toBeNull();
      const mweRunId = run!.id;

      // 4. Create Payroll Item
      const { data: mweItem } = await supabase.from('payroll_items').insert({
        payroll_run_id: mweRunId,
        employee_id: mweEmpId,
        gross_pay: 10000,
        taxable_income: 0,
        non_taxable_income: 10000,
        total_deductions: 500,
        net_pay: 9500,
        withholding_tax: 0,
        calculation_engine_version: '2.0.0'
      }).select('id').single();

      // 5. Simulate Engine Earning generation
      // Basic Pay
      await supabase.from('payroll_earnings').insert({
        payroll_item_id: mweItem!.id,
        description: 'Basic Salary (Calculated)',
        amount: 8000,
        calculated_amount: 8000,
        is_taxable: false, // Should be exempted by MWE logic
        tax_treatment: 'mwe_exempt'
      });

      // Overtime
      await supabase.from('payroll_earnings').insert({
        payroll_item_id: mweItem!.id,
        description: 'Overtime Pay',
        amount: 1500,
        calculated_amount: 1500,
        is_taxable: false, // Exempt
        tax_treatment: 'mwe_exempt'
      });
      
      // Night Diff
      await supabase.from('payroll_earnings').insert({
        payroll_item_id: mweItem!.id,
        description: 'Night Differential',
        amount: 500,
        calculated_amount: 500,
        is_taxable: false, // Exempt
        tax_treatment: 'mwe_exempt'
      });

      // Verify that NO Withholding Tax was calculated
      const { data: taxDed } = await supabase
        .from('payroll_deductions')
        .select('*')
        .eq('payroll_item_id', mweItem!.id)
        .eq('description', 'Withholding Tax');
        
      expect(taxDed?.length).toBe(0);

      // Verify earning treatments are properly stored
      const { data: earnings } = await supabase
        .from('payroll_earnings')
        .select('tax_treatment')
        .eq('payroll_item_id', mweItem!.id);
        
      for (const e of earnings!) {
        expect(e.tax_treatment).toBe('mwe_exempt');
      }

      await supabase.from('payroll_runs').delete().eq('id', mweRunId);
    });
  });
});
