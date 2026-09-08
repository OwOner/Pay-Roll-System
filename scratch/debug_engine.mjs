import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import Decimal from "decimal.js";
import { resolveDayRule } from "../src/lib/payroll/day-rules";

dotenv.config({ path: ".env.local" });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const employeeId = "926fa8c6-ce8e-4554-830a-c1f58cf77200"; // Ramon
  const periodStart = "2026-08-30";
  const periodEnd = "2026-09-05";

  // Fetch compensation
  const { data: activeComp } = await supabase
    .from('employee_compensation_history')
    .select('*')
    .eq('employee_id', employeeId)
    .lte('effective_from', periodEnd)
    .order('effective_from', { ascending: false })
    .limit(1)
    .single();

  // Fetch Active Work Policy
  const { data: positionsData } = await supabase.from('positions').select('default_work_policy_id').eq('title', '').single() || { data: null };
  const { data: specificPolicies } = await supabase.from('employee_work_policies').select('*, work_policies(*)').eq('employee_id', employeeId);
  
  let activePolicy = null;
  if (specificPolicies && specificPolicies.length > 0) {
    const specific = specificPolicies.find((ewp) => !ewp.effective_to || new Date(ewp.effective_to) >= new Date(periodStart));
    if (specific) activePolicy = specific.work_policies;
  }
  
  if (!activePolicy && positionsData?.default_work_policy_id) {
    const { data: wp } = await supabase.from('work_policies').select('*').eq('id', positionsData.default_work_policy_id).single();
    if (wp) activePolicy = wp;
  }
  
  if (!activePolicy) {
    const { data: cwps } = await supabase.from('work_policies').select('*').eq('is_company_default', true).limit(1);
    if (cwps && cwps.length > 0) activePolicy = cwps[0];
  }

  console.log("activePolicy:", activePolicy);
}

run().catch(console.error);
