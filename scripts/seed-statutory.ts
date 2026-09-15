import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function seed() {
  console.log("Seeding statutory tables...");

  const govTables = [
    { type: 'SSS', name: 'SSS 2026' },
    { type: 'PhilHealth', name: 'PhilHealth 5% 2026' },
    { type: 'Pag-IBIG', name: 'Pag-IBIG 2026' }
  ];

  for (const t of govTables) {
    const { data, error } = await supabase.from('government_contribution_tables').insert({
      contribution_type: t.type,
      name: t.name,
      effective_from: '2026-01-01',
      is_active: true
    }).select('id').single();

    if (error) {
      console.error(error);
      continue;
    }

    const tableId = data.id;

    if (t.type === 'SSS') {
      await supabase.from('government_contribution_brackets').insert({
        contribution_table_id: tableId,
        salary_min: 0,
        salary_max: 999999,
        employee_amount: 1350,
        employer_amount: 2850
      });
    } else if (t.type === 'PhilHealth') {
      await supabase.from('government_contribution_brackets').insert({
        contribution_table_id: tableId,
        salary_min: 10000,
        salary_max: 100000,
        employee_rate: 0.025,
        employer_rate: 0.025
      });
    } else if (t.type === 'Pag-IBIG') {
      await supabase.from('government_contribution_brackets').insert({
        contribution_table_id: tableId,
        salary_min: 0,
        salary_max: 999999,
        employee_rate: 0.02,
        employer_rate: 0.02
      });
    }
  }

  console.log("Done seeding.");
}

seed();
