"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get("new_password") as string
  const confirm = formData.get("confirm_password") as string

  if (password !== confirm) {
    return { error: "Passwords do not match." }
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updateProfilePicture(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const avatarFile = formData.get("avatar") as File
  if (!avatarFile || avatarFile.size === 0) {
    return { error: "No file provided." }
  }

  // Find their employee record via profile
  const { data: profile } = await supabase.from('profiles').select('employee_id').eq('id', user.id).single()
  if (!profile || !profile.employee_id) {
    return { error: "No employee record linked to this account." }
  }

  const fileExt = avatarFile.name.split('.').pop()
  const fileName = `${profile.employee_id}-${Date.now()}.${fileExt}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, avatarFile)

  if (uploadError) {
    return { error: uploadError.message }
  }

  const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
  
  const { error: updateError } = await supabase
    .from('employees')
    .update({ avatar_url: publicUrlData.publicUrl })
    .eq('id', profile.employee_id)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/settings/account')
  return { success: true }
}
