import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const employeeId = "926fa8c6-ce8e-4554-830a-c1f58cf77200"; // Ramon
  const periodStart = "2026-08-30"; // from UI
  const periodEnd = "2026-09-05";

  // 1. Fetch period
  const { data: dbPeriod } = await supabase
    .from('payroll_periods')
    .select('id')
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .eq('pay_frequency', 'Weekly')
    .single();

  console.log("Period:", dbPeriod);

  // 2. Fetch timesheet
  if (dbPeriod) {
    const { data: timesheetData, error } = await supabase
      .from('timesheets')
      .select('*, timesheet_details(*)')
      .eq('employee_id', employeeId)
      .eq('payroll_period_id', dbPeriod.id)
      .single();
    
    console.log("Timesheet error:", error);
    console.log("Timesheet id:", timesheetData?.id);
    console.log("Timesheet details count:", timesheetData?.timesheet_details?.length);
  }
}
run().catch(console.error);
