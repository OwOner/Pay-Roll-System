"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateCompanySettings(formData: FormData) {
  const supabase = await createClient()

  const data = {
    company_name: formData.get("company_name")?.toString(),
    address: formData.get("address")?.toString(),
    tin: formData.get("tin")?.toString(),
    email: formData.get("email")?.toString(),
    phone: formData.get("phone")?.toString(),
    sss_number: formData.get("sss_number")?.toString(),
    philhealth_number: formData.get("philhealth_number")?.toString(),
    pagibig_number: formData.get("pagibig_number")?.toString(),
  }

  // Get the single row id
  const { data: settings } = await supabase.from("company_settings").select("id").single()

  if (settings) {
    const { error } = await supabase
      .from("company_settings")
      .update(data)
      .eq("id", settings.id)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from("company_settings")
      .insert(data)

    if (error) return { error: error.message }
  }

  revalidatePath("/settings/company")
  return { success: true }
}
