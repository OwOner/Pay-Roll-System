const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const names = [
  "Anjelo Cochico",
  "Christian Genesis Valladolid",
  "Daniel Labayo",
  "Danillo Labayo",
  "Erezon Banares",
  "Japhet Palmares",
  "Jay-ar Lacay",
  "Jerome Bajaro",
  "John Lloyd Navarro",
  "John Paul Espano",
  "John Rey Balderama",
  "Julius Lawrence Fortajada",
  "Ramon Adion"
];

async function seed() {
  console.log("Starting employee seeding...");
  
  // Get max employee code to generate new ones
  const { data: currentEmps, error: empErr } = await supabase
    .from('employees')
    .select('employee_code')
    .order('employee_code', { ascending: false })
    .limit(1);

  if (empErr) {
    console.error("Error fetching max emp code:", empErr);
    return;
  }

  let nextCodeNum = 1001;
  if (currentEmps && currentEmps.length > 0) {
    const maxCodeStr = currentEmps[0].employee_code;
    const match = maxCodeStr.match(/EMP-(\d+)/);
    if (match) {
      nextCodeNum = parseInt(match[1]) + 1;
    }
  }

  for (const name of names) {
    const parts = name.split(' ');
    const firstName = parts.slice(0, parts.length - 1).join(' ');
    const lastName = parts[parts.length - 1];
    
    const empCode = `EMP-${String(nextCodeNum++).padStart(4, '0')}`;
    const email = `${firstName.replace(/\s+/g, '').toLowerCase()}.${lastName.toLowerCase()}@example.com`;

    // 1. Insert Employee
    const { data: newEmp, error: insertErr } = await supabase
      .from('employees')
      .insert({
        employee_code: empCode,
        first_name: firstName,
        last_name: lastName,
        email: email,
        employment_status: 'Active',
        employment_type: 'Regular',
        date_hired: '2026-01-01'
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error(`Error inserting employee ${name}:`, insertErr);
      continue;
    }

    const empId = newEmp.id;
    console.log(`Inserted ${name} (${empCode}) [${empId}]`);

    // 2. Insert Compensation
    const { error: compErr } = await supabase
      .from('employee_compensation_history')
      .insert({
        employee_id: empId,
        salary_basis: 'Daily',
        salary_type: 'Daily', // keep for backwards compatibility if still required
        basic_salary: 0,
        daily_rate: 610.00,
        pay_frequency: 'Weekly',
        effective_from: '2026-01-01'
      });
      
    if (compErr) {
      console.error(`Error inserting compensation for ${name}:`, compErr);
    }

    // 3. Insert Statutory Profile (No tax / deductions)
    const { error: statErr } = await supabase
      .from('employee_statutory_profiles')
      .insert({
        employee_id: empId,
        sss_applicable: false,
        philhealth_applicable: false,
        pagibig_applicable: false,
        tax_applicable: false,
        is_mwe: true,
        effective_from: '2026-01-01',
        reason: 'No statutory deductions or taxes per request'
      });
      
    if (statErr) {
      console.error(`Error inserting statutory profile for ${name}:`, statErr);
    }
  }
  
  console.log("Seeding complete.");
}

seed();
