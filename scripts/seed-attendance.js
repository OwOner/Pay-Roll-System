const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generate all dates from Aug 30 to Sept 10 (inclusive)
function getDatesInRange(startStr, endStr) {
  const dates = [];
  const start = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T00:00:00');
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function isSunday(dateStr) {
  // 0 = Sunday in JS
  return new Date(dateStr + 'T00:00:00').getDay() === 0;
}

async function seedAttendance() {
  console.log('Fetching employees...');
  const { data: employees, error: empErr } = await supabase
    .from('employees')
    .select('id, employee_code, first_name, last_name')
    .order('employee_code');

  if (empErr) {
    console.error('Failed to fetch employees:', empErr.message);
    process.exit(1);
  }

  const dates = getDatesInRange('2026-08-30', '2026-09-10');

  console.log(`\nDates to seed (${dates.length} total):`);
  dates.forEach(d => {
    const day = new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
    console.log(`  ${d} (${day})${isSunday(d) ? ' -- SKIP (Sunday)' : ' -- Present'}`);
  });

  const workDates = dates.filter(d => !isSunday(d));
  const sundayDates = dates.filter(d => isSunday(d));
  console.log(`\n${workDates.length} work days, ${sundayDates.length} Sundays (skipped)`);

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const emp of employees) {
    console.log(`\nProcessing: ${emp.first_name} ${emp.last_name} (${emp.employee_code})`);

    // Check existing records to avoid duplicates
    const { data: existing } = await supabase
      .from('attendance_records')
      .select('work_date')
      .eq('employee_id', emp.id)
      .gte('work_date', '2026-08-30')
      .lte('work_date', '2026-09-10');

    const existingDates = new Set((existing || []).map(r => r.work_date));

    const records = workDates
      .filter(d => !existingDates.has(d))
      .map(d => ({
        employee_id: emp.id,
        work_date: d,
        status: 'Present',
        regular_hours: 8,
        overtime_hours: 0,
        night_differential_hours: 0,
        is_rest_day: false,
        source: 'system',
        time_in: d + 'T08:00:00',
        time_out: d + 'T17:00:00',
      }));

    const skipped = workDates.length - records.length;
    if (skipped > 0) {
      console.log(`  Skipping ${skipped} already-existing record(s).`);
      totalSkipped += skipped;
    }

    if (records.length === 0) {
      console.log('  All records already exist for this employee.');
      continue;
    }

    // Insert in one batch
    const { error: insErr } = await supabase
      .from('attendance_records')
      .insert(records);

    if (insErr) {
      console.error(`  Error inserting records for ${emp.employee_code}:`, insErr.message);
      totalErrors++;
    } else {
      console.log(`  ✓ Inserted ${records.length} attendance records.`);
      totalInserted += records.length;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`  Records inserted : ${totalInserted}`);
  console.log(`  Records skipped  : ${totalSkipped} (already existed)`);
  console.log(`  Employees w/ err : ${totalErrors}`);
  console.log('\nDone!');
}

seedAttendance().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
