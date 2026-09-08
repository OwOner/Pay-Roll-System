const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedTestEmployee() {
  console.log("Seeding test employee...");

  // 1. Create Employee
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .insert({
      first_name: "Juan",
      last_name: "Dela Cruz",
      employee_code: "EMP-TEST-01",
      employment_type: "Regular",
      employment_status: "Active",
      date_hired: "2025-01-01",
      work_schedule: { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] }
    })
    .select()
    .single();

  if (empError) {
    console.error("Failed to create employee:", empError.message);
    return;
  }
  console.log("Created Employee:", employee.first_name, employee.last_name);

  // 2. Create Compensation History
  const { error: compError } = await supabase
    .from('employee_compensation_history')
    .insert({
      employee_id: employee.id,
      effective_from: "2025-01-01",
      salary_type: "Monthly",
      basic_salary: 15000,
      daily_rate: 681.81, // Approximate: (15000 * 12) / 261
      hourly_rate: 85.22,
      pay_frequency: "Semi-monthly"
    });

  if (compError) {
    console.error("Failed to create compensation:", compError.message);
    return;
  }
  console.log("Created Compensation: ₱15,000/month");

  // 3. Insert Attendance Records (September 1 - 5, 2026)
  // Sept 1 (Tue) - Sept 4 (Fri) = 4 days
  const attendanceData = [
    { employee_id: employee.id, work_date: "2026-09-01", status: "Present", regular_hours: 8, source: "system" },
    { employee_id: employee.id, work_date: "2026-09-02", status: "Present", regular_hours: 8, source: "system" },
    { employee_id: employee.id, work_date: "2026-09-03", status: "Absent", regular_hours: 0, source: "system" },
    { employee_id: employee.id, work_date: "2026-09-04", status: "Present", regular_hours: 8, source: "system" },
  ];

  const { error: attError } = await supabase
    .from('attendance_records')
    .insert(attendanceData);

  if (attError) {
    console.error("Failed to create attendance:", attError.message);
    return;
  }
  console.log("Created 4 attendance records for September 1-4, 2026 (1 absent day).");

  // Missing records for the rest of the period (Sept 7 - Sept 15) will trigger "Missing Records" in the timesheet!

  console.log("\n✅ Test employee seeded successfully!");
  console.log("You can now test the Timesheet Generation for the period '2026-09-01' to '2026-09-15'.");
}

seedTestEmployee();
