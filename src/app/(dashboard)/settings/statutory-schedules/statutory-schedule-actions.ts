"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type AllocationInput = {
  id?: string
  period_sequence: number
  contribution_type: 'SSS' | 'PhilHealth' | 'Pag-IBIG'
  allocation_percentage: number
}

export async function createStatutorySchedule(data: {
  name: string
  pay_frequency: string
  description?: string
  effective_from: string
  allocations: AllocationInput[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Validation: Duplicate sequences
  const set = new Set()
  for (const alloc of data.allocations) {
    const key = `${alloc.period_sequence}_${alloc.contribution_type}`
    if (set.has(key)) {
      return { success: false, error: `Duplicate configuration for Sequence ${alloc.period_sequence}, ${alloc.contribution_type}.` }
    }
    set.add(key)
    if (alloc.allocation_percentage < 0 || alloc.allocation_percentage > 100) {
      return { success: false, error: `Allocation percentage must be between 0 and 100.` }
    }
  }

  // 2. Validation: Total <= 100% per contribution type
  const totals: Record<string, number> = { SSS: 0, PhilHealth: 0, 'Pag-IBIG': 0 }
  for (const alloc of data.allocations) {
    totals[alloc.contribution_type] += Number(alloc.allocation_percentage)
  }
  for (const type of ['SSS', 'PhilHealth', 'Pag-IBIG']) {
    if (totals[type] > 100) {
      return { success: false, error: `Total allocation for ${type} exceeds 100% (${totals[type]}%).` }
    }
  }

  // 3. Insert Schedule
  const { data: schedule, error: insertErr } = await supabase
    .from('company_statutory_schedules')
    .insert({
      name: data.name,
      pay_frequency: data.pay_frequency,
      description: data.description,
      effective_from: data.effective_from,
      created_by: user?.id,
      is_active: true
    })
    .select()
    .single()

  if (insertErr) {
    return { success: false, error: insertErr.message }
  }

  // 4. Insert Allocations
  if (data.allocations.length > 0) {
    const allocData = data.allocations.map(a => ({
      schedule_id: schedule.id,
      period_sequence: a.period_sequence,
      contribution_type: a.contribution_type,
      allocation_percentage: a.allocation_percentage
    }))
    
    const { error: allocErr } = await supabase
      .from('statutory_schedule_allocations')
      .insert(allocData)
      
    if (allocErr) {
      return { success: false, error: `Error saving allocations: ${allocErr.message}` }
    }
  }

  revalidatePath('/settings/statutory-schedules')
  return { success: true }
}

export async function supersedeStatutorySchedule(oldScheduleId: string, data: {
  name: string
  pay_frequency: string
  description?: string
  effective_from: string
  allocations: AllocationInput[]
}) {
  const supabase = await createClient()
  
  // Create new schedule first (let it validate)
  const res = await createStatutorySchedule(data)
  if (!res.success) return res

  // Set the old schedule's effective_to to the day before effective_from of the new one
  const oldEffectiveTo = new Date(data.effective_from)
  oldEffectiveTo.setDate(oldEffectiveTo.getDate() - 1)
  
  const { error: updateErr } = await supabase
    .from('company_statutory_schedules')
    .update({ 
      is_active: false,
      effective_to: oldEffectiveTo.toISOString().split('T')[0] 
    })
    .eq('id', oldScheduleId)

  if (updateErr) {
    return { success: false, error: `New schedule created but failed to disable old one: ${updateErr.message}` }
  }

  revalidatePath('/settings/statutory-schedules')
  return { success: true }
}

export async function toggleStatutoryScheduleActive(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const is_active = formData.get('is_active') === 'true'
  
  const { error } = await supabase
    .from('company_statutory_schedules')
    .update({ is_active: !is_active })
    .eq('id', id)
    
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath('/settings/statutory-schedules')
  return { success: true }
}

export async function deleteStatutorySchedule(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  
  const { error } = await supabase
    .from('company_statutory_schedules')
    .delete()
    .eq('id', id)
    
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath('/settings/statutory-schedules')
  return { success: true }
}
