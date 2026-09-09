"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { WorkPolicy } from "@/lib/payroll/rate-calculator"

export async function getWorkPolicies() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("work_policies")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching work policies:", error)
    throw new Error("Failed to fetch work policies")
  }

  return data
}

export async function createWorkPolicy(payload: Omit<WorkPolicy, "id"> & { name: string, description?: string }) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("work_policies")
    .insert([{
      name: payload.name,
      description: payload.description,
      scheduled_hours_per_day: payload.scheduled_hours_per_day,
      scheduled_days_per_week: payload.scheduled_days_per_week,
      rest_days: payload.rest_days,
      rest_days_paid: payload.rest_days_paid,
      daily_rate_method: payload.daily_rate_method,
      annualization_factor: payload.annualization_factor,
      ot_enabled: payload.ot_enabled,
      requires_ot_approval: payload.requires_ot_approval,
      ut_deduction_enabled: payload.ut_deduction_enabled,
      night_differential_enabled: payload.night_differential_enabled,
      custom_day_rules: payload.custom_day_rules
    }])

  if (error) {
    console.error("Error creating work policy:", error)
    return { error: error.message }
  }

  revalidatePath("/settings/work-policies")
  return { success: true }
}

export async function deleteWorkPolicy(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("work_policies")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting work policy:", error)
    return { error: error.message }
  }

  revalidatePath("/settings/work-policies")
  return { success: true }
}

export async function updateWorkPolicy(id: string, payload: Omit<WorkPolicy, "id"> & { name: string, description?: string }) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("work_policies")
    .update({
      name: payload.name,
      description: payload.description,
      scheduled_hours_per_day: payload.scheduled_hours_per_day,
      scheduled_days_per_week: payload.scheduled_days_per_week,
      rest_days: payload.rest_days,
      rest_days_paid: payload.rest_days_paid,
      daily_rate_method: payload.daily_rate_method,
      annualization_factor: payload.annualization_factor,
      ot_enabled: payload.ot_enabled,
      requires_ot_approval: payload.requires_ot_approval,
      ut_deduction_enabled: payload.ut_deduction_enabled,
      night_differential_enabled: payload.night_differential_enabled,
      custom_day_rules: payload.custom_day_rules
    })
    .eq("id", id)

  if (error) {
    console.error("Error updating work policy:", error)
    return { error: error.message }
  }

  revalidatePath("/settings/work-policies")
  return { success: true }
}
