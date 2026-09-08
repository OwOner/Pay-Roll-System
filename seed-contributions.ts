/**
 * seed-contributions.ts
 *
 * Seeds verified official Philippine government contribution configurations.
 *
 * Sources:
 *   SSS:      SSS Circular No. 2024-006, effective January 1, 2025
 *             https://www.sss.gov.ph/sss-contribution-table/
 *   PhilHealth: PhilHealth Advisory No. 2025-0002 / RA 11223 (UHC Act final rate)
 *               https://www.philhealth.gov.ph/
 *   Pag-IBIG: HDMF Circular No. 460, effective February 1, 2024
 *             https://www.pagibigfund.gov.ph/
 *
 * IMPORTANT: These are government-authoritative configurations. They are seeded
 * with status='Published' and must NOT be modified after payroll calculations
 * reference them. New rates require a new superseding configuration record.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// SSS Contribution Table — Full 61-bracket MSC schedule
// Source: SSS Circular No. 2024-006 (effective January 1, 2025)
// Total rate: 15% (Employee 5%, Employer 10%)
// MSC range: ₱5,000 – ₱35,000
// MPF applies to MSC > ₱20,000 (excess above ₱20,000)
// EC: ₱10 for MSC < ₱15,000; ₱30 for MSC ≥ ₱15,000 (employer only)
// ============================================================
const SSS_BRACKETS = [
  // compensation_min, compensation_max, msc, ss_emp, ss_empr, mpf_emp, mpf_empr, ec_empr
  // Brackets 1–20: MSC ₱5,000 – ₱14,500 (EC = ₱10)
  [0,        5249.99,  5000,  250,  500,  0,   0,    10],
  [5250,     5749.99,  5500,  275,  550,  0,   0,    10],
  [5750,     6249.99,  6000,  300,  600,  0,   0,    10],
  [6250,     6749.99,  6500,  325,  650,  0,   0,    10],
  [6750,     7249.99,  7000,  350,  700,  0,   0,    10],
  [7250,     7749.99,  7500,  375,  750,  0,   0,    10],
  [7750,     8249.99,  8000,  400,  800,  0,   0,    10],
  [8250,     8749.99,  8500,  425,  850,  0,   0,    10],
  [8750,     9249.99,  9000,  450,  900,  0,   0,    10],
  [9250,     9749.99,  9500,  475,  950,  0,   0,    10],
  [9750,     10249.99, 10000, 500,  1000, 0,   0,    10],
  [10250,    10749.99, 10500, 525,  1050, 0,   0,    10],
  [10750,    11249.99, 11000, 550,  1100, 0,   0,    10],
  [11250,    11749.99, 11500, 575,  1150, 0,   0,    10],
  [11750,    12249.99, 12000, 600,  1200, 0,   0,    10],
  [12250,    12749.99, 12500, 625,  1250, 0,   0,    10],
  [12750,    13249.99, 13000, 650,  1300, 0,   0,    10],
  [13250,    13749.99, 13500, 675,  1350, 0,   0,    10],
  [13750,    14249.99, 14000, 700,  1400, 0,   0,    10],
  [14250,    14749.99, 14500, 725,  1450, 0,   0,    10],
  // Brackets 21–31: MSC ₱15,000 – ₱20,000 (EC = ₱30, no MPF)
  [14750,    15249.99, 15000, 750,  1500, 0,   0,    30],
  [15250,    15749.99, 15500, 775,  1550, 0,   0,    30],
  [15750,    16249.99, 16000, 800,  1600, 0,   0,    30],
  [16250,    16749.99, 16500, 825,  1650, 0,   0,    30],
  [16750,    17249.99, 17000, 850,  1700, 0,   0,    30],
  [17250,    17749.99, 17500, 875,  1750, 0,   0,    30],
  [17750,    18249.99, 18000, 900,  1800, 0,   0,    30],
  [18250,    18749.99, 18500, 925,  1850, 0,   0,    30],
  [18750,    19249.99, 19000, 950,  1900, 0,   0,    30],
  [19250,    19749.99, 19500, 975,  1950, 0,   0,    30],
  [19750,    20249.99, 20000, 1000, 2000, 0,   0,    30],
  // Brackets 32–61: MSC ₱20,500 – ₱35,000 (EC = ₱30, MPF applies to excess > ₱20,000)
  // SS regular employee capped at ₱1,000 (5% of ₱20,000)
  // SS regular employer capped at ₱2,000 (10% of ₱20,000)
  // MPF employee = 5% of (MSC - 20,000)
  // MPF employer = 10% of (MSC - 20,000)
  [20250,    20749.99, 20500, 1000, 2000, 25,  50,   30],
  [20750,    21249.99, 21000, 1000, 2000, 50,  100,  30],
  [21250,    21749.99, 21500, 1000, 2000, 75,  150,  30],
  [21750,    22249.99, 22000, 1000, 2000, 100, 200,  30],
  [22250,    22749.99, 22500, 1000, 2000, 125, 250,  30],
  [22750,    23249.99, 23000, 1000, 2000, 150, 300,  30],
  [23250,    23749.99, 23500, 1000, 2000, 175, 350,  30],
  [23750,    24249.99, 24000, 1000, 2000, 200, 400,  30],
  [24250,    24749.99, 24500, 1000, 2000, 225, 450,  30],
  [24750,    25249.99, 25000, 1000, 2000, 250, 500,  30],
  [25250,    25749.99, 25500, 1000, 2000, 275, 550,  30],
  [25750,    26249.99, 26000, 1000, 2000, 300, 600,  30],
  [26250,    26749.99, 26500, 1000, 2000, 325, 650,  30],
  [26750,    27249.99, 27000, 1000, 2000, 350, 700,  30],
  [27250,    27749.99, 27500, 1000, 2000, 375, 750,  30],
  [27750,    28249.99, 28000, 1000, 2000, 400, 800,  30],
  [28250,    28749.99, 28500, 1000, 2000, 425, 850,  30],
  [28750,    29249.99, 29000, 1000, 2000, 450, 900,  30],
  [29250,    29749.99, 29500, 1000, 2000, 475, 950,  30],
  [29750,    30249.99, 30000, 1000, 2000, 500, 1000, 30],
  [30250,    30749.99, 30500, 1000, 2000, 525, 1050, 30],
  [30750,    31249.99, 31000, 1000, 2000, 550, 1100, 30],
  [31250,    31749.99, 31500, 1000, 2000, 575, 1150, 30],
  [31750,    32249.99, 32000, 1000, 2000, 600, 1200, 30],
  [32250,    32749.99, 32500, 1000, 2000, 625, 1250, 30],
  [32750,    33249.99, 33000, 1000, 2000, 650, 1300, 30],
  [33250,    33749.99, 33500, 1000, 2000, 675, 1350, 30],
  [33750,    34249.99, 34000, 1000, 2000, 700, 1400, 30],
  [34250,    34749.99, 34500, 1000, 2000, 725, 1450, 30],
  [34750,    null,     35000, 1000, 2000, 750, 1500, 30], // ₱34,750 and above
];

async function seed() {
  console.log("=== Seeding Government Contribution Configurations ===\n");

  // --------------------------------------------------------
  // 1. SSS
  // --------------------------------------------------------
  console.log("1. Seeding SSS (Circular No. 2024-006)...");

  // Create SSS table record
  const { data: sssTable, error: sssTableErr } = await supabase
    .from('government_contribution_tables')
    .insert({
      contribution_type: 'SSS',
      name: 'SSS Contribution Schedule — Circular No. 2024-006',
      table_type: 'government',
      status: 'Draft', // Insert as Draft first
      source_agency: 'Social Security System',
      issuance_reference: 'SSS Circular No. 2024-006',
      source_url: 'https://www.sss.gov.ph/sss-contribution-table/',
      statutory_effective_from: '2025-01-01',
      effective_from: '2025-01-01',
      is_active: true,
    })
    .select('id')
    .single();

  if (sssTableErr) {
    console.error("  ✗ Failed to create SSS table:", sssTableErr.message);
    return;
  }

  // Insert all 61 brackets
  const sssBrackets = SSS_BRACKETS.map(([min, max, msc, ss_emp, ss_empr, mpf_emp, mpf_empr, ec]) => ({
    contribution_table_id: sssTable.id,
    salary_min: min,
    salary_max: max,
    monthly_salary_credit: msc,
    regular_ss_employee: ss_emp,
    regular_ss_employer: ss_empr,
    mpf_employee: mpf_emp,
    mpf_employer: mpf_empr,
    ec_employer: ec,
    // Legacy columns (keep populated for backward compat)
    employee_amount: ss_emp,
    employer_amount: ss_empr,
  }));

  const { error: sssBracketsErr } = await supabase
    .from('government_contribution_brackets')
    .insert(sssBrackets);

  if (sssBracketsErr) {
    console.error("  ✗ Failed to insert SSS brackets:", sssBracketsErr.message);
    return;
  }
  
  // Publish the table
  const { error: publishErr } = await supabase
    .from('government_contribution_tables')
    .update({ status: 'Published', is_active: true })
    .eq('id', sssTable.id);

  if (publishErr) {
    console.error("  ✗ Failed to publish SSS table:", publishErr.message);
    return;
  }

  console.log(`  ✓ SSS table created and published with ${sssBrackets.length} brackets (ID: ${sssTable.id})`);

  // --------------------------------------------------------
  // 2. PhilHealth
  // --------------------------------------------------------
  console.log("\n2. Seeding PhilHealth (Advisory 2025-0002 / RA 11223)...");

  const { data: phData, error: phErr } = await supabase
    .from('philhealth_configs')
    .insert({
      name: 'PhilHealth Premium Rate (Advisory 2025-0002 / RA 11223)',
      table_type: 'government',
      status: 'Published',
      source_agency: 'Philippine Health Insurance Corporation',
      issuance_reference: 'PhilHealth Advisory No. 2025-0002 / RA 11223 (UHC Act)',
      source_url: 'https://www.philhealth.gov.ph/',
      statutory_effective_from: '2025-01-01',
      effective_from: '2025-01-01',
      is_active: true,
      premium_rate: 0.050000,  // 5% total (2.5% employee + 2.5% employer)
      floor_mbs: 10000.00,     // Minimum Monthly Basic Salary basis
      ceiling_mbs: 100000.00,  // Maximum Monthly Basic Salary basis
    })
    .select('id')
    .single();

  if (phErr) {
    console.error("  ✗ Failed to create PhilHealth config:", phErr.message);
    return;
  }
  console.log(`  ✓ PhilHealth config created (ID: ${phData.id})`);
  console.log(`    Rate: 5% | Floor MBS: ₱10,000 | Ceiling MBS: ₱100,000`);

  // --------------------------------------------------------
  // 3. Pag-IBIG / HDMF
  // --------------------------------------------------------
  console.log("\n3. Seeding Pag-IBIG (HDMF Circular No. 460)...");

  const { data: pagibigData, error: pagibigErr } = await supabase
    .from('pagibig_configs')
    .insert({
      name: 'Pag-IBIG Contribution Schedule — HDMF Circular No. 460',
      table_type: 'government',
      status: 'Published',
      source_agency: 'Home Development Mutual Fund (Pag-IBIG)',
      issuance_reference: 'HDMF Circular No. 460',
      source_url: 'https://www.pagibigfund.gov.ph/',
      statutory_effective_from: '2024-02-01',
      effective_from: '2024-02-01',
      is_active: true,
      employee_rate_low: 0.010000,   // 1% for MFS ≤ ₱1,500
      employee_rate_high: 0.020000,  // 2% for MFS > ₱1,500
      salary_threshold: 1500.00,     // The ₱1,500 threshold
      employer_rate: 0.020000,       // 2% employer
      max_compensation: 10000.00,    // MFS ceiling (max ₱10,000 for calculation)
    })
    .select('id')
    .single();

  if (pagibigErr) {
    console.error("  ✗ Failed to create Pag-IBIG config:", pagibigErr.message);
    return;
  }
  console.log(`  ✓ Pag-IBIG config created (ID: ${pagibigData.id})`);
  console.log(`    Employee: 1% (≤₱1,500) / 2% (>₱1,500) | Employer: 2% | Max MFS: ₱10,000`);

  // --------------------------------------------------------
  // 4. Verification Summary
  // --------------------------------------------------------
  console.log("\n=== Verification ===");
  
  const { count: sssCount } = await supabase
    .from('government_contribution_brackets')
    .select('*', { count: 'exact', head: true })
    .eq('contribution_table_id', sssTable.id);
  
  console.log(`SSS brackets in DB: ${sssCount} (expected 61)`);
  
  // Spot-check: MSC ₱15,000 bracket
  const { data: spot } = await supabase
    .from('government_contribution_brackets')
    .select('monthly_salary_credit, regular_ss_employee, regular_ss_employer, ec_employer')
    .eq('contribution_table_id', sssTable.id)
    .eq('monthly_salary_credit', 15000)
    .single();
  
  if (spot) {
    console.log(`SSS MSC ₱15,000 spot-check: Employee=₱${spot.regular_ss_employee}, Employer=₱${spot.regular_ss_employer}, EC=₱${spot.ec_employer}`);
    const expected = spot.regular_ss_employee === 750 && spot.regular_ss_employer === 1500 && spot.ec_employer === 30;
    console.log(`  ${expected ? '✓ CORRECT' : '✗ MISMATCH — expected ₱750/₱1,500/₱30'}`);
  }

  console.log("\n✅ Contribution seeding complete.");
}

seed().catch(console.error);
