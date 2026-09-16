import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl!, supabaseKey!);
  
  const { data: item, error: fetchErr } = await supabase.from('payroll_items').select('id, payroll_run_id').limit(1).single();
  
  if (!item) {
    console.log("No payroll items exist.");
    return;
  }
  
  const { data, error } = await supabase
    .from('payroll_items')
    .select(`
      *,
      employees (
        id,
        first_name,
        last_name,
        employee_code,
        department_id,
        position_id,
        departments ( name ),
        positions ( title )
      ),
      payroll_runs (
        id,
        payroll_periods (
          period_start,
          period_end,
          pay_date,
          pay_frequency
        )
      ),
      payroll_earnings (
        id,
        type,
        description,
        amount,
        is_taxable,
        tax_treatment
      ),
      payroll_deductions (
        id,
        type,
        description,
        amount,
        is_pre_tax
      )
    `)
    .eq('id', item.id)
    .eq('payroll_run_id', item.payroll_run_id)
    .single();

  if (error) {
    console.error("Error fetching payslip:", error);
  } else {
    console.log("Success fetching payslip.");
  }
}
run();
