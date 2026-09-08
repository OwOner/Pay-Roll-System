import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedTaxes() {
  console.log("Seeding BIR Tax Table (TRAIN Law / RR 11-2018, Annex E)...");

  // Create the tax table
  const { data: taxTable, error: tableErr } = await supabase
    .from('tax_tables')
    .insert({
      name: 'BIR TRAIN Law Tax Table (RR 11-2018, Annex E)',
      effective_from: '2018-01-01',
      is_active: true,
    })
    .select('id')
    .single();

  if (tableErr) {
    console.error("Failed to create tax table:", tableErr.message);
    return;
  }

  const id = taxTable.id;
  console.log("Tax table ID:", id);

  const brackets = [
    // WEEKLY (BIR Annex E)
    { tax_table_id: id, pay_frequency: 'Weekly', minimum_income: 0, maximum_income: 4807.99, base_tax: 0, excess_rate: 0 },
    { tax_table_id: id, pay_frequency: 'Weekly', minimum_income: 4808, maximum_income: 7691.99, base_tax: 0, excess_rate: 0.15 },
    { tax_table_id: id, pay_frequency: 'Weekly', minimum_income: 7692, maximum_income: 15384.99, base_tax: 432.60, excess_rate: 0.20 },
    { tax_table_id: id, pay_frequency: 'Weekly', minimum_income: 15385, maximum_income: 38461.99, base_tax: 1971.20, excess_rate: 0.25 },
    { tax_table_id: id, pay_frequency: 'Weekly', minimum_income: 38462, maximum_income: 153845.99, base_tax: 7740.45, excess_rate: 0.30 },
    { tax_table_id: id, pay_frequency: 'Weekly', minimum_income: 153846, maximum_income: null, base_tax: 42355.65, excess_rate: 0.35 },
    // SEMI-MONTHLY
    { tax_table_id: id, pay_frequency: 'Semi-Monthly', minimum_income: 0, maximum_income: 10416.99, base_tax: 0, excess_rate: 0 },
    { tax_table_id: id, pay_frequency: 'Semi-Monthly', minimum_income: 10417, maximum_income: 16666.99, base_tax: 0, excess_rate: 0.15 },
    { tax_table_id: id, pay_frequency: 'Semi-Monthly', minimum_income: 16667, maximum_income: 33332.99, base_tax: 937.50, excess_rate: 0.20 },
    { tax_table_id: id, pay_frequency: 'Semi-Monthly', minimum_income: 33333, maximum_income: 83332.99, base_tax: 4270.70, excess_rate: 0.25 },
    { tax_table_id: id, pay_frequency: 'Semi-Monthly', minimum_income: 83333, maximum_income: 333332.99, base_tax: 16770.70, excess_rate: 0.30 },
    { tax_table_id: id, pay_frequency: 'Semi-Monthly', minimum_income: 333333, maximum_income: null, base_tax: 91770.70, excess_rate: 0.35 },
    // MONTHLY
    { tax_table_id: id, pay_frequency: 'Monthly', minimum_income: 0, maximum_income: 20832.99, base_tax: 0, excess_rate: 0 },
    { tax_table_id: id, pay_frequency: 'Monthly', minimum_income: 20833, maximum_income: 33332.99, base_tax: 0, excess_rate: 0.15 },
    { tax_table_id: id, pay_frequency: 'Monthly', minimum_income: 33333, maximum_income: 66666.99, base_tax: 1875, excess_rate: 0.20 },
    { tax_table_id: id, pay_frequency: 'Monthly', minimum_income: 66667, maximum_income: 166666.99, base_tax: 8541.80, excess_rate: 0.25 },
    { tax_table_id: id, pay_frequency: 'Monthly', minimum_income: 166667, maximum_income: 666666.99, base_tax: 33541.80, excess_rate: 0.30 },
    { tax_table_id: id, pay_frequency: 'Monthly', minimum_income: 666667, maximum_income: null, base_tax: 183541.80, excess_rate: 0.35 },
    // DAILY
    { tax_table_id: id, pay_frequency: 'Daily', minimum_income: 0, maximum_income: 684.99, base_tax: 0, excess_rate: 0 },
    { tax_table_id: id, pay_frequency: 'Daily', minimum_income: 685, maximum_income: 1095.99, base_tax: 0, excess_rate: 0.15 },
    { tax_table_id: id, pay_frequency: 'Daily', minimum_income: 1096, maximum_income: 2191.99, base_tax: 61.65, excess_rate: 0.20 },
    { tax_table_id: id, pay_frequency: 'Daily', minimum_income: 2192, maximum_income: 5478.99, base_tax: 280.85, excess_rate: 0.25 },
    { tax_table_id: id, pay_frequency: 'Daily', minimum_income: 5479, maximum_income: 21917.99, base_tax: 1102.60, excess_rate: 0.30 },
    { tax_table_id: id, pay_frequency: 'Daily', minimum_income: 21918, maximum_income: null, base_tax: 6034.30, excess_rate: 0.35 },
  ];

  const { error } = await supabase.from('tax_brackets').insert(brackets);
  if (error) {
    console.error("Failed to insert tax brackets:", error.message);
  } else {
    console.log(`✓ Seeded ${brackets.length} BIR tax brackets.`);
  }
}

seedTaxes();
