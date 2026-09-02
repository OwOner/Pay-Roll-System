"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function createEmployee(formData: FormData) {
  const supabase = await createClient()

  const newEmployee = {
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
  Object.keys(newEmployee).forEach(key => {
    if ((newEmployee as any)[key] === "") {
      delete (newEmployee as any)[key]
    }
  })

  const { data, error } = await supabase
    .from("employees")
    .insert(newEmployee)
    .select("id")
    .single()

  if (error) {
    console.error("Error creating employee:", error)
    // In a real app, we'd return the error to display to the user
    // For now, let's just log it and maybe redirect to the list with an error query param
    // or just let it fail gracefully
    throw new Error(error.message)
  }

  // Redirect to the new employee's profile
  redirect(`/employees/${data.id}`)
}
