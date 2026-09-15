"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function updateEmployee(id: string, formData: FormData) {
  const supabase = await createClient()

  const rawDept = formData.get('department_id') as string
  const rawPos = formData.get('position_id') as string
  
  const department_id = rawDept && rawDept !== 'none' ? rawDept : null
  const position_id = rawPos && rawPos !== 'none' ? rawPos : null

  const updatedEmployee = {
    first_name: formData.get("first_name") as string,
    middle_name: formData.get("middle_name") as string,
    last_name: formData.get("last_name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    date_hired: formData.get("date_hired") as string,
    employment_type: formData.get("employment_type") as string,
    employment_status: formData.get("employment_status") as string,
    department_id,
    position_id,
    sss_number: formData.get("sss_number") as string,
    philhealth_number: formData.get("philhealth_number") as string,
    pagibig_number: formData.get("pagibig_number") as string,
    tin_number: formData.get("tin_number") as string,
  }

  // Remove empty strings so default nulls apply if needed
  Object.keys(updatedEmployee).forEach(key => {
    if ((updatedEmployee as any)[key] === "") {
      (updatedEmployee as any)[key] = null
    }
  })

  const { error } = await supabase
    .from("employees")
    .update(updatedEmployee)
    .eq("id", id)

  if (error) {
    console.error("Error updating employee:", error)
    throw new Error(error.message)
  }

  // Redirect back to the profile
  redirect(`/employees/${id}`)
}

export async function updateStatutoryProfile(employeeId: string, formData: FormData) {
  const supabase = await createClient()
  
  const effectiveFrom = formData.get("effective_from") as string
  if (!effectiveFrom) return { error: "Effective From date is required." }

  // Check if we already have an active profile
  const { data: currentProfile } = await supabase
    .from('employee_statutory_profiles')
    .select('id, effective_from, tax_applicable, is_mwe')
    .eq('employee_id', employeeId)
    .is('effective_to', null)
    .single()

  if (currentProfile) {
    if (new Date(effectiveFrom) <= new Date(currentProfile.effective_from)) {
      return { error: "New effective date must be strictly after the current profile's effective date." }
    }
    
    // Cap the old profile
    const effectiveTo = new Date(new Date(effectiveFrom).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    await supabase
      .from('employee_statutory_profiles')
      .update({ effective_to: effectiveTo })
      .eq('id', currentProfile.id)
  }

// Insert new profile
  const taxApplicable = formData.get("tax_applicable") === "true"
  const isMwe = formData.get("is_mwe") === "true"
  const reason = formData.get("reason") as string
  
  const { error } = await supabase
    .from('employee_statutory_profiles')
    .insert({
      employee_id: employeeId,
      effective_from: effectiveFrom,
      reason: reason,
      sss_applicable: formData.get("sss_applicable") === "true",
      philhealth_applicable: formData.get("philhealth_applicable") === "true",
      pagibig_applicable: formData.get("pagibig_applicable") === "true",
      tax_applicable: taxApplicable,
      is_mwe: isMwe
    })

  if (error) {
    console.error("Error inserting statutory profile:", error)
    return { error: error.message }
  }

  // Audit Logging
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id || null

  const oldTax = currentProfile ? currentProfile.tax_applicable : null
  const oldMwe = currentProfile ? currentProfile.is_mwe : null

  if (oldTax !== taxApplicable || oldMwe !== isMwe) {
    await supabase.from('audit_logs').insert({
      action: 'STATUTORY_PROFILE_UPDATED',
      entity_type: 'employee',
      entity_id: employeeId,
      actor_id: userId,
      details: {
        reason: reason,
        effective_from: effectiveFrom,
        tax_applicable: { old: oldTax, new: taxApplicable },
        is_mwe: { old: oldMwe, new: isMwe }
      }
    })
  }

  redirect(`/employees/${employeeId}/edit`)
}
