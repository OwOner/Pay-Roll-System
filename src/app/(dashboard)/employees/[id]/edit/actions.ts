"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function updateEmployee(id: string, formData: FormData) {
  const supabase = await createClient()

  const updatedEmployee = {
    first_name: formData.get("first_name") as string,
    middle_name: formData.get("middle_name") as string,
    last_name: formData.get("last_name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    date_hired: formData.get("date_hired") as string,
    employment_type: formData.get("employment_type") as string,
    employment_status: formData.get("employment_status") as string,
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
    .select('id, effective_from')
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
  const { error } = await supabase
    .from('employee_statutory_profiles')
    .insert({
      employee_id: employeeId,
      effective_from: effectiveFrom,
      reason: formData.get("reason") as string,
      sss_applicable: formData.get("sss_applicable") === "true",
      philhealth_applicable: formData.get("philhealth_applicable") === "true",
      pagibig_applicable: formData.get("pagibig_applicable") === "true"
    })

  if (error) {
    console.error("Error inserting statutory profile:", error)
    return { error: error.message }
  }

  redirect(`/employees/${employeeId}/edit`)
}
