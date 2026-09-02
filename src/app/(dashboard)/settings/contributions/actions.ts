"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function initializePhilHealth() {
  const { data: table, error: tableError } = await adminSupabase
    .from('government_contribution_tables')
    .insert({
      contribution_type: 'PhilHealth',
      name: 'PhilHealth 5% (2024 Onwards)',
      effective_from: '2024-01-01',
      is_active: true,
      agency: 'PhilHealth',
      reference_number: 'PhilHealth Circular No. 2024-0001',
      source_url: 'https://www.philhealth.gov.ph',
      notes: '5% Premium Rate. Salary Floor P10,000. Ceiling P100,000.'
    })
    .select('id')
    .single()

  if (tableError) return { error: tableError.message }

  // PhilHealth is calculated as a percentage for the entire bracket, so we just specify min/max and rates
  // Minimum salary floor is 10,000. Max is 100,000.
  // Actually, below 10,000 is fixed at 500 total (250 each).
  // 10,000 to 100,000 is 5% total (2.5% each).
  // Above 100,000 is fixed at 5000 total (2500 each).
  
  const brackets = [
    {
      contribution_table_id: table.id,
      salary_min: 0,
      salary_max: 9999.99,
      employee_amount: 250.00,
      employer_amount: 250.00,
      employee_rate: 0,
      employer_rate: 0
    },
    {
      contribution_table_id: table.id,
      salary_min: 10000,
      salary_max: 100000,
      employee_amount: 0,
      employer_amount: 0,
      employee_rate: 0.0250,
      employer_rate: 0.0250
    },
    {
      contribution_table_id: table.id,
      salary_min: 100000.01,
      salary_max: null,
      employee_amount: 2500.00,
      employer_amount: 2500.00,
      employee_rate: 0,
      employer_rate: 0
    }
  ]

  const { error: bracketsError } = await adminSupabase
    .from('government_contribution_brackets')
    .insert(brackets)

  if (bracketsError) return { error: bracketsError.message }

  revalidatePath('/settings/contributions')
  return { success: true }
}

export async function initializePagIBIG() {
  const { data: table, error: tableError } = await adminSupabase
    .from('government_contribution_tables')
    .insert({
      contribution_type: 'Pag-IBIG',
      name: 'Pag-IBIG Fund (2024 Onwards)',
      effective_from: '2024-02-01',
      is_active: true,
      agency: 'Pag-IBIG Fund',
      reference_number: 'HDMF Circular No. 460',
      source_url: 'https://www.pagibigfund.gov.ph',
      notes: 'Max fund salary raised to P10,000. Total max contribution P400 (P200 EE / P200 ER).'
    })
    .select('id')
    .single()

  if (tableError) return { error: tableError.message }

  const brackets = [
    {
      contribution_table_id: table.id,
      salary_min: 0,
      salary_max: 1500,
      employee_amount: 0,
      employer_amount: 0,
      employee_rate: 0.0100,
      employer_rate: 0.0200
    },
    {
      contribution_table_id: table.id,
      salary_min: 1500.01,
      salary_max: 10000,
      employee_amount: 0,
      employer_amount: 0,
      employee_rate: 0.0200,
      employer_rate: 0.0200
    },
    {
      // Cap at 10,000, so flat 200 each
      contribution_table_id: table.id,
      salary_min: 10000.01,
      salary_max: null,
      employee_amount: 200.00,
      employer_amount: 200.00,
      employee_rate: 0,
      employer_rate: 0
    }
  ]

  const { error: bracketsError } = await adminSupabase
    .from('government_contribution_brackets')
    .insert(brackets)

  if (bracketsError) return { error: bracketsError.message }

  revalidatePath('/settings/contributions')
  return { success: true }
}

export async function initializeSSS() {
  const { data: table, error: tableError } = await adminSupabase
    .from('government_contribution_tables')
    .insert({
      contribution_type: 'SSS',
      name: 'SSS 2025 Schedule (15%)',
      effective_from: '2025-01-01',
      is_active: true,
      agency: 'Social Security System',
      reference_number: 'SSS Circular 2025',
      source_url: 'https://www.sss.gov.ph',
      notes: '15% Total Rate (9.5% ER, 5.5% EE). Min MSC P4,000, Max MSC P35,000.'
    })
    .select('id')
    .single()

  if (tableError) return { error: tableError.message }

  const brackets = []
  const EE_RATE = 0.055
  const ER_RATE = 0.095

  // SSS table generation
  for (let msc = 4000; msc <= 35000; msc += 500) {
    let min = msc === 4000 ? 0 : msc - 249.99
    let max = msc === 35000 ? null : msc + 250.00

    // WISP (Workers' Investment and Savings Program) starts at MSC > 20000
    // But since the new limit is 35k, the regular SS is up to 35k?
    // According to SSS 2025, regular SS is up to 20k, WISP is from 20.5k to 35k.
    // However, the total deduction amount for the employee is simply based on the MSC.
    // Total EE = MSC * 5.5%, Total ER = MSC * 9.5%
    let ee_amt = msc * EE_RATE
    let er_amt = msc * ER_RATE

    brackets.push({
      contribution_table_id: table.id,
      salary_min: min,
      salary_max: max,
      employee_amount: Number(ee_amt.toFixed(2)),
      employer_amount: Number(er_amt.toFixed(2)),
      employee_rate: 0,
      employer_rate: 0
    })
  }

  // Batch insert
  const { error: bracketsError } = await adminSupabase
    .from('government_contribution_brackets')
    .insert(brackets)

  if (bracketsError) return { error: bracketsError.message }

  revalidatePath('/settings/contributions')
  return { success: true }
}
