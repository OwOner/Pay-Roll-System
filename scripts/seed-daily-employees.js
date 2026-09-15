const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const employeesToSeed = [
  { firstName: "Anjelo", lastName: "Cochico" },
  { firstName: "Christian Genesis", lastName: "Valladolid" },
  { firstName: "Daniel", lastName: "Labayo" },
  { firstName: "Danillo", lastName: "Labayo" },
  { firstName: "Erezon", lastName: "Banares" },
  { firstName: "Japhet", lastName: "Palmares" },
  { firstName: "Jerome", lastName: "Bajaro" },
  { firstName: "John Lloyd", lastName: "Navarro" },
  { firstName: "John Paul", lastName: "Espano" },
  { firstName: "John Rey", lastName: "Balderama" },
  { firstName: "Julius Lawrence", lastName: "Fortajada" },
  { firstName: "Ramon", lastName: "Adion" },
  { firstName: "Jay-ar", lastName: "Lacay" }
];

async function seedEmployees() {
  console.log("Starting employee import...");

  // Also fix any existing compensation records with NULL salary_basis
  const { error: fixErr } = await supabase
    .from('employee_compensation_history')
    .update({ salary_basis: 'Daily' })
    .is('salary_basis', null)
    .eq('salary_type', 'Daily');
  if (fixErr) {
    console.warn("Warning fixing NULL salary_basis:", fixErr.message);
  }

  // Fetch existing employees to avoid duplicates and get code sequence
  const { data: existingEmployees, error: fetchErr } = await supabase
    .from('employees')
    .select('id, employee_code, first_name, last_name');

  if (fetchErr) {
    console.error("Failed to fetch existing employees:", fetchErr.message);
    process.exit(1);
  }

  let codeCounter = existingEmployees.length + 1;

  for (const emp of employeesToSeed) {
    const exists = existingEmployees.find(
      e => e.first_name.toLowerCase() === emp.firstName.toLowerCase() &&
           e.last_name.toLowerCase() === emp.lastName.toLowerCase()
    );

    if (exists) {
      console.log(`Skipping existing employee: ${emp.firstName} ${emp.lastName} (${exists.employee_code})`);
      continue;
    }

    const employeeCode = `EMP-${codeCounter.toString().padStart(4, '0')}`;
    codeCounter++;

    // 1. Insert into employees
    const { data: newEmp, error: empErr } = await supabase
      .from('employees')
      .insert({
        employee_code: employeeCode,
        first_name: emp.firstName,
        last_name: emp.lastName,
        employment_status: 'Active',
        employment_type: 'Regular',
        date_hired: '2026-01-01',
        is_payroll_exempt: false,
        work_schedule: {
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        }
      })
      .select('id, employee_code, first_name, last_name')
      .single();

    if (empErr) {
      console.error(`Failed to create employee ${emp.firstName} ${emp.lastName}:`, empErr.message);
      continue;
    }

    console.log(`Created employee: ${newEmp.first_name} ${newEmp.last_name} (${newEmp.employee_code}) [${newEmp.id}]`);

    // 2. Insert Compensation Record (Daily ₱500)
    const { error: compErr } = await supabase
      .from('employee_compensation_history')
      .insert({
        employee_id: newEmp.id,
        salary_basis: 'Daily',
        salary_type: 'Daily',
        basic_salary: 500,
        daily_rate: 500,
        hourly_rate: 62.5,
        weekly_rate: null,
        pay_frequency: 'Weekly',
        working_hours_per_day: 8,
        working_days_per_week: 6,
        effective_from: '2026-01-01'
      });

    if (compErr) {
      console.error(`Failed to create compensation for ${newEmp.employee_code}:`, compErr.message);
    } else {
      console.log(`  -> Added compensation: ₱500/day (Salary Basis: Daily, Frequency: Weekly)`);
    }

    // 3. Insert Initial Statutory Profile
    const { error: statErr } = await supabase
      .from('employee_statutory_profiles')
      .insert({
        employee_id: newEmp.id,
        sss_applicable: false,
        philhealth_applicable: false,
        pagibig_applicable: false,
        effective_from: '2026-01-01',
        reason: 'Initial setup on hire'
      });

    if (statErr) {
      console.warn(`  -> Warning creating statutory profile:`, statErr.message);
    }
  }

  console.log("\nImport finished successfully!");
}

seedEmployees().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
