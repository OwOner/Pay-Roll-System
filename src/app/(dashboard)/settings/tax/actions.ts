"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
)

export async function initializeDefaultTaxes(formData?: FormData) {
  // 1. Create Tax Table
  const { data: taxTable, error: tableError } = await adminSupabase
    .from('tax_tables')
    .insert({
      name: 'TRAIN Law (2023 Onwards)',
      effective_from: '2023-01-01',
      is_active: true
    })
    .select('id')
    .single()

  if (tableError) {
    return { error: tableError.message }
  }

  // 2. Insert Brackets (Semi-monthly)
  const brackets = [
    {
      tax_table_id: taxTable.id,
      pay_frequency: 'Semi-monthly',
      minimum_income: 0,
      maximum_income: 10417,
      base_tax: 0,
      excess_rate: 0.00
    },
    {
      tax_table_id: taxTable.id,
      pay_frequency: 'Semi-monthly',
      minimum_income: 10417,
      maximum_income: 16667,
      base_tax: 0,
      excess_rate: 0.15
    },
    {
      tax_table_id: taxTable.id,
      pay_frequency: 'Semi-monthly',
      minimum_income: 16667,
      maximum_income: 33333,
      base_tax: 937.50,
      excess_rate: 0.20
    },
    {
      tax_table_id: taxTable.id,
      pay_frequency: 'Semi-monthly',
      minimum_income: 33333,
      maximum_income: 83333,
      base_tax: 4270.83,
      excess_rate: 0.25
    },
    {
      tax_table_id: taxTable.id,
      pay_frequency: 'Semi-monthly',
      minimum_income: 83333,
      maximum_income: 333333,
      base_tax: 16770.83,
      excess_rate: 0.30
    },
    {
      tax_table_id: taxTable.id,
      pay_frequency: 'Semi-monthly',
      minimum_income: 333333,
      maximum_income: null, // And above
      base_tax: 91770.83,
      excess_rate: 0.35
    }
  ]

  const { error: bracketsError } = await adminSupabase
    .from('tax_brackets')
    .insert(brackets)

  if (bracketsError) {
    return { error: bracketsError.message }
  }

  revalidatePath('/settings/tax')
  return { success: true }
}

export async function toggleTaxTableActive(formData: FormData) {
  const id = formData.get('id') as string
  const currentStatus = formData.get('is_active') === 'true'
  
  await adminSupabase
    .from('tax_tables')
    .update({ is_active: !currentStatus })
    .eq('id', id)
    
  revalidatePath('/settings/tax')
}

export async function createNewTaxTable(formData?: FormData) {
  await adminSupabase
    .from('tax_tables')
    .insert({
      name: 'New Custom Tax Table',
      effective_from: new Date().toISOString().split('T')[0],
      is_active: false
    })
    
  revalidatePath('/settings/tax')
}

export async function saveTaxBrackets(taxTableId: string, brackets: any[]) {
  const { error: delError } = await adminSupabase
    .from('tax_brackets')
    .delete()
    .eq('tax_table_id', taxTableId)

  if (delError) throw new Error(delError.message)

  if (brackets.length > 0) {
    const { error: insError } = await adminSupabase
      .from('tax_brackets')
      .insert(brackets)
    
    if (insError) throw new Error(insError.message)
  }

  revalidatePath('/settings/tax')
  return { success: true }
}

