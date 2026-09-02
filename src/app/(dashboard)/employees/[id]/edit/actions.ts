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
    employee_code: formData.get("employee_code") as string,
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
