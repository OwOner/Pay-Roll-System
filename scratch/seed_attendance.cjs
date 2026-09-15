const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedAttendance() {
  console.log("Starting attendance seeding...");

  const { data: employees, error: empErr } = await supabase
    .from('employees')
    .select('id, first_name, last_name, employment_status')
    .eq('employment_status', 'Active');

  if (empErr) {
    console.error("Error fetching employees:", empErr);
    return;
  }

  if (!employees || employees.length === 0) {
    console.log("No active employees found. Please run seed_specific_emps.cjs first.");
    return;
  }

  const startDate = new Date('2026-09-01');
  const days = 7; // Sep 1 to Sep 7

  let totalInserted = 0;

  for (const emp of employees) {
    for (let i = 0; i < days; i++) {
      const recordDate = new Date(startDate);
      recordDate.setDate(recordDate.getDate() + i);
      const dateStr = recordDate.toISOString().split('T')[0];

      // Regular 8 hours per day
      let regularHours = 8.00;
      let status = 'Present';
      
      // Let's add some slight variations:
      // If it's a Sunday (0), it's a Rest Day, maybe 0 hours
      const dayOfWeek = recordDate.getDay();
      let isRestDay = false;
      if (dayOfWeek === 0) { // Sunday
        isRestDay = true;
        regularHours = 0;
        status = 'Rest Day';
      } else if (emp.first_name === 'Anjelo' && dayOfWeek === 3) {
        // Example: Anjelo took a leave on Wednesday
        regularHours = 0;
        status = 'Leave';
      }

      // Check if it already exists
      const { data: existing } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('employee_id', emp.id)
        .eq('work_date', dateStr)
        .maybeSingle();

      if (existing) {
        // Skip existing
        continue;
      }

      const { error: insertErr } = await supabase
        .from('attendance_records')
        .insert({
          employee_id: emp.id,
          work_date: dateStr,
          regular_hours: regularHours,
          overtime_hours: 0,
          night_differential_hours: 0,
          is_rest_day: isRestDay,
          status: status
        });

      if (insertErr) {
        console.error(`Error inserting attendance for ${emp.first_name} on ${dateStr}:`, insertErr);
      } else {
        totalInserted++;
      }
    }
  }

  console.log(`Successfully inserted ${totalInserted} attendance records.`);
}

seedAttendance();
