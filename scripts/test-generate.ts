import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl!, supabaseKey!);
  
  const empId = '352ee643-08b4-48c8-a962-e3c8ef0cfd16'; // Juan
  
  const { data: p } = await supabase.from('payroll_periods').select('id, period_start, period_end').limit(1).single();
  
  const timesheetData = {
      employee_id: empId,
      payroll_period_id: p!.id,
      period_start: p!.period_start,
      period_end: p!.period_end,
      status: 'Draft',
      is_stale: false,
      missing_records_count: 0,
      generated_at: new Date().toISOString(),
      
      total_regular_hours: 80,
      total_recorded_ot_hours: 0,
      total_payable_ot_hours: 0,
      total_recorded_ut_hours: 0,
      total_payable_ut_hours: 0,
      calculated_total_regular_hours: 80,
      calculated_absent_days: 0,
      calculated_present_days: 10,
      
      absent_days: 0,
      updated_at: new Date().toISOString()
  };

  const { data: newTs, error: insertErr } = await supabase.from('timesheets').insert(timesheetData).select().single()
  if (insertErr) {
    console.error("Error inserting timesheet:", insertErr);
  } else {
    console.log("Success:", newTs);
  }
}
run();
