import { createClient } from "@supabase/supabase-js"

const adminSupabase = createClient(
  'http://127.0.0.1:54331',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function seed() {
  console.log("Seeding dummy payroll items to light up the dashboard...")
  
  // 1. Get a Paid payroll run
  const { data: run } = await adminSupabase.from('payroll_runs').select('id').eq('status', 'Paid').limit(1).single();
  if (!run) {
    console.log("No paid runs found, skipping seed.")
    return;
  }

  // 2. Get active employees
  const { data: employees } = await adminSupabase.from('employees').select('id');
  if (!employees || employees.length === 0) {
    console.log("No employees found.")
    return;
  }

  // 3. Insert payroll items
  for (const emp of employees) {
    const gross = 30000 / 2;
    const net = gross - 2500; // rough net
    
    await adminSupabase.from('payroll_items').insert({
      payroll_run_id: run.id,
      employee_id: emp.id,
      calculation_engine_version: '1.0.0',
      gross_pay: gross,
      net_pay: net,
      taxable_income: gross,
      non_taxable_income: 0,
      withholding_tax: 1000,
      total_deductions: 2500,
      sss_employee: 500,
      sss_employer: 1050,
      philhealth_employee: 300,
      philhealth_employer: 300,
      pagibig_employee: 100,
      pagibig_employer: 100
    });
  }
  
  console.log("Done! Dashboard should now show real amounts.")
}

seed();
