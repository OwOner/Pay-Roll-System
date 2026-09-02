import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('payroll_items')
    .select(`
      id,
      gross_pay,
      net_pay,
      payroll_runs!inner (
        status,
        payroll_periods ( period_start, period_end, pay_date, pay_frequency )
      ),
      employees ( first_name, last_name, id )
    `)
    .in('payroll_runs.status', ['Approved', 'Paid'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Query Error:", error);
  } else {
    console.log("Success! Found:", data.length);
  }
}

test();
