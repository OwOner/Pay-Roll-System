import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: timesheets } = await supabase.from('timesheets').select('*').eq('payroll_period_id', '18a12e5e-c9d9-497f-b951-85ab79b57d95');
  console.log("Timesheets to delete:", timesheets.length);
  for (const ts of timesheets) {
    await supabase.from('timesheet_details').delete().eq('timesheet_id', ts.id);
    await supabase.from('timesheets').delete().eq('id', ts.id);
  }
  console.log("Deleted old timesheets. User must hit Generate Timesheets again.");
}

run().catch(console.error);
