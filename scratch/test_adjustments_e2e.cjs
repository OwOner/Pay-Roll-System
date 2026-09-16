const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runTest() {
  console.log("Starting E2E Backend Simulation for Phase 6C...");

  // 1. Get an active employee
  const { data: employees } = await supabase.from('employees').select('id').limit(1);
  const employeeId = employees[0].id;
  console.log("Selected Employee ID:", employeeId);

  // 2. File an adjustment
  const { data: adj, error: adjErr } = await supabase.from('payroll_adjustments').insert({
    employee_id: employeeId,
    adjustment_type: 'Earning',
    description: 'Test Hours Correction',
    amount: 5000,
    reason: 'E2E Testing',
    status: 'Pending'
  }).select('id').single();
  
  if (adjErr) throw new Error("Failed to create adjustment: " + adjErr.message);
  const adjustmentId = adj.id;
  console.log("Filed Adjustment:", adjustmentId, "- Status: Pending");

  // 3. Approve the adjustment
  await supabase.from('payroll_adjustments').update({ status: 'Approved' }).eq('id', adjustmentId);
  console.log("Approved Adjustment:", adjustmentId);

  // 4. Create a dummy payroll run
  let { data: period, error: periodErr } = await supabase.from('payroll_periods').insert({
    period_start: '2099-01-01',
    period_end: '2099-01-15',
    pay_frequency: 'Semi-Monthly',
    pay_date: '2099-01-15'
  }).select('id').single();
  
  if (periodErr) {
    // If it already exists, just fetch it
    const { data: existing } = await supabase.from('payroll_periods').select('id').eq('period_start', '2099-01-01').single();
    if (existing) {
      period = existing;
    } else {
      throw new Error("Failed to create period: " + periodErr.message);
    }
  }

  const { data: run, error: runErr } = await supabase.from('payroll_runs').insert({
    payroll_period_id: period.id,
    status: 'Pending Approval'
  }).select('id').single();
  
  if (runErr) throw new Error("Failed to create run: " + runErr.message);
  const runId = run.id;
  console.log("Generated Payroll Run:", runId);

  // 5. Create a payroll item for the run
  const { data: item } = await supabase.from('payroll_items').insert({
    payroll_run_id: runId,
    employee_id: employeeId,
    gross_pay: 5000,
    taxable_income: 5000,
    non_taxable_income: 0,
    total_deductions: 0,
    net_pay: 5000,
    withholding_tax: 0,
    calculation_engine_version: '2.0.0'
  }).select('id').single();

  // 6. Simulate the engine creating an earning linked to the adjustment
  await supabase.from('payroll_earnings').insert({
    payroll_item_id: item.id,
    description: 'Adjustment: Test Hours Correction',
    amount: 5000,
    calculated_amount: 5000,
    is_taxable: true,
    source: 'payroll_adjustments',
    source_id: adjustmentId
  });
  console.log("Simulated engine hydration and earning insertion.");

  // 7. Approve the run (This should fire the trigger)
  console.log("Approving Payroll Run...");
  await supabase.from('payroll_runs').update({ status: 'Approved' }).eq('id', runId);

  // 8. Verify the adjustment status
  const { data: verifyAdj } = await supabase.from('payroll_adjustments').select('status').eq('id', adjustmentId).single();
  console.log("VERIFICATION -> Adjustment Status is now:", verifyAdj.status);
  
  if (verifyAdj.status === 'Processed') {
    console.log("✅ SUCCESS: The database trigger correctly processed the adjustment upon run approval.");
  } else {
    console.log("❌ FAILED: The adjustment status did not change to Processed.");
  }

  // Cleanup
  console.log("Cleaning up test data...");
  await supabase.from('payroll_runs').delete().eq('id', runId);
  await supabase.from('payroll_periods').delete().eq('id', period.id);
  await supabase.from('payroll_adjustments').delete().eq('id', adjustmentId);
}

runTest().catch(console.error);
