const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fillMissing() {
  const { data: employee } = await supabase.from('employees').select('id').eq('employee_code', 'EMP-TEST-01').single();
  if (!employee) return;

  const attendanceData = [
    { employee_id: employee.id, work_date: "2026-09-07", status: "Present", regular_hours: 8, source: "system" },
    { employee_id: employee.id, work_date: "2026-09-08", status: "Present", regular_hours: 8, source: "system" },
    { employee_id: employee.id, work_date: "2026-09-09", status: "Present", regular_hours: 8, source: "system" },
    { employee_id: employee.id, work_date: "2026-09-10", status: "Present", regular_hours: 8, source: "system" },
    { employee_id: employee.id, work_date: "2026-09-11", status: "Present", regular_hours: 8, source: "system" },
    { employee_id: employee.id, work_date: "2026-09-14", status: "Present", regular_hours: 8, source: "system" },
    { employee_id: employee.id, work_date: "2026-09-15", status: "Present", regular_hours: 8, source: "system" },
  ];

  await supabase.from('attendance_records').insert(attendanceData);
  console.log("Inserted the remaining 7 records.");
}

fillMissing();
