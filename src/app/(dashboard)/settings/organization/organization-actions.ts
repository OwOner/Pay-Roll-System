"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// DEPARTMENTS
export async function getDepartments() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('is_active', true)
    .order('name')
  
  if (error) return { error: error.message }
  return { departments: data || [] }
}

export async function upsertDepartment(id: string | null, name: string, description: string) {
  const supabase = await createClient()
  const payload = { name, description }

  let error;
  if (id) {
    const { error: e } = await supabase.from('departments').update(payload).eq('id', id)
    error = e
  } else {
    const { error: e } = await supabase.from('departments').insert([payload])
    error = e
  }

  if (error) return { error: error.message }
  revalidatePath('/settings/organization')
  return { success: true }
}

export async function deleteDepartment(id: string) {
  const supabase = await createClient()
  
  // Check for linked active employees or positions
  const { count: empCount } = await supabase.from('employees').select('id', { count: 'exact', head: true }).eq('department_id', id)
  if (empCount && empCount > 0) return { error: "Cannot delete department: it has active employees." }

  const { count: posCount } = await supabase.from('positions').select('id', { count: 'exact', head: true }).eq('department_id', id).eq('is_active', true)
  if (posCount && posCount > 0) return { error: "Cannot delete department: it has active positions." }

  const { error } = await supabase.from('departments').update({ is_active: false }).eq('id', id)
  if (error) return { error: error.message }
  
  revalidatePath('/settings/organization')
  return { success: true }
}

// POSITIONS
export async function getPositions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('positions')
    .select(`
      *,
      departments(name),
      work_policies(name)
    `)
    .eq('is_active', true)
    .order('title')
  
  if (error) return { error: error.message }
  return { positions: data || [] }
}

export async function upsertPosition(id: string | null, payload: { title: string, description: string, department_id: string | null, default_work_policy_id: string | null }) {
  const supabase = await createClient()

  let error;
  if (id) {
    const { error: e } = await supabase.from('positions').update(payload).eq('id', id)
    error = e
  } else {
    const { error: e } = await supabase.from('positions').insert([payload])
    error = e
  }

  if (error) return { error: error.message }
  revalidatePath('/settings/organization')
  return { success: true }
}

export async function deletePosition(id: string) {
  const supabase = await createClient()
  
  const { count: empCount } = await supabase.from('employees').select('id', { count: 'exact', head: true }).eq('position_id', id)
  if (empCount && empCount > 0) return { error: "Cannot delete position: it is assigned to employees." }

  const { error } = await supabase.from('positions').update({ is_active: false }).eq('id', id)
  if (error) return { error: error.message }
  
  revalidatePath('/settings/organization')
  return { success: true }
}
