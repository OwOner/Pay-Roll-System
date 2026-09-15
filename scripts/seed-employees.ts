import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedEmployees() {
  console.log("Fetching reference data...");
  const { data: depts } = await supabase.from('departments').select('id');
  const { data: poss } = await supabase.from('positions').select('id');
  const { data: policies } = await supabase.from('work_policies').select('id');

  const getRand = (arr: any[]) => arr && arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)].id : null;

  const newEmployees = [
    {
      first_name: "Juan",
      last_name: "Dela Cruz",
      email: "juan.delacruz" + Date.now() + "@example.com",
      phone: "09171234567",
      employment_type: "Regular",
      employment_status: "Active",
      date_hired: "2026-01-15",
      gender: "Male",
      department_id: getRand(depts || []),
      position_id: getRand(poss || []),
      work_policy_id: getRand(policies || []), // Will test explicit policy
      _compensation: { salary_basis: "Monthly", rate: 25000, pay_frequency: "Semi-Monthly" }
    },
    {
      first_name: "Maria",
      last_name: "Santos",
      email: "maria.santos" + Date.now() + "@example.com",
      phone: "09181234567",
      employment_type: "Contractual",
      employment_status: "Active",
      date_hired: "2026-06-01",
      gender: "Female",
      department_id: getRand(depts || []),
      position_id: getRand(poss || []),
      work_policy_id: null, // Test no policy
      _compensation: { salary_basis: "Daily", rate: 850, pay_frequency: "Weekly" }
    },
    {
      first_name: "Carlos",
      last_name: "Reyes",
      email: "carlos.reyes" + Date.now() + "@example.com",
      phone: "09191234567",
      employment_type: "Project-based",
      employment_status: "Active",
      date_hired: "2026-03-10",
      gender: "Male",
      department_id: getRand(depts || []),
      position_id: getRand(poss || []),
      work_policy_id: getRand(policies || []),
      _compensation: { salary_basis: "Hourly", rate: 120, pay_frequency: "Weekly" }
    },
    {
      first_name: "Elena",
      last_name: "Gomez",
      email: "elena.gomez" + Date.now() + "@example.com",
      phone: "09201234567",
      employment_type: "Regular",
      employment_status: "Active",
      date_hired: "2025-11-20",
      gender: "Female",
      department_id: getRand(depts || []),
      position_id: getRand(poss || []),
      work_policy_id: null,
      _compensation: { salary_basis: "Weekly", rate: 4500, pay_frequency: "Weekly" }
    }
  ];

  for (const empData of newEmployees) {
    const compData = empData._compensation;
    delete (empData as any)._compensation;
    
    const workPolicyId = (empData as any).work_policy_id;
    delete (empData as any).work_policy_id;

    // Create random employee code
    const countData = await supabase.from('employees').select('*', { count: 'exact', head: true });
    const newId = (countData.count || 0) + 1;
    const randomChar = Math.random().toString(36).substring(2, 4).toUpperCase();
    (empData as any).employee_code = `EMP-${newId.toString().padStart(4, '0')}-${randomChar}`;

    console.log(`Inserting ${empData.first_name} ${empData.last_name}...`);
    const { data: emp, error: empErr } = await supabase.from('employees').insert(empData).select('id, date_hired').single();
    
    if (empErr) {
      console.error("Error inserting employee:", empErr);
      continue;
    }

    // Insert statutory profile
    await supabase.from('employee_statutory_profiles').insert({
      employee_id: emp.id,
      sss_applicable: true,
      philhealth_applicable: true,
      pagibig_applicable: true,
      effective_from: emp.date_hired,
      reason: 'Initial setup on hire'
    });

    // Insert compensation
    await supabase.from('employee_compensation_history').insert({
      employee_id: emp.id,
      salary_basis: compData.salary_basis,
      rate: compData.rate,
      pay_frequency: compData.pay_frequency,
      effective_from: emp.date_hired,
      reason: 'Initial setup on hire'
    });

    if (workPolicyId) {
      await supabase.from('employee_work_policies').insert({
        employee_id: emp.id,
        work_policy_id: workPolicyId,
        effective_from: emp.date_hired
      });
    }

    console.log(`  - Success! ID: ${emp.id}`);
  }
  
  console.log("Done seeding employees!");
}

seedEmployees().catch(console.error);
