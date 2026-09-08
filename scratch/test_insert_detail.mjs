import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('timesheet_details').insert({
    timesheet_id: '961a8c72-a0d5-4925-8ee5-f2f751586853',
    date: '2026-08-30',
    day_type: 'Regular Workday',
    scheduled_hours: 8,
    regular_hours: 8,
    recorded_ot_hours: 0,
    approved_ot_hours: 0,
    payable_ot_hours: 0,
    recorded_ut_hours: 0,
    excused_ut_hours: 0,
    payable_ut_hours: 0
  }).select();
  console.log("Insert result:", data, error);
}
run().catch(console.error);
