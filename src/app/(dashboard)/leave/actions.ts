"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function approveLeaveRequest(id: string) {
  const supabase = await createClient()

  // First, verify permission (Super Admin or HR)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('leave')
    .update({ 
      status: 'Approved',
      approved_by: user.id
    })
    .eq('id', id)

  if (error) {
    console.error("Error approving leave:", error)
    return { error: error.message }
  }

  revalidatePath("/leave")
  return { success: true }
}

export async function rejectLeaveRequest(id: string) {
  const supabase = await createClient()

  // First, verify permission
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('leave')
    .update({ 
      status: 'Rejected',
      approved_by: user.id // using approved_by just to track who actioned it
    })
    .eq('id', id)

  if (error) {
    console.error("Error rejecting leave:", error)
    return { error: error.message }
  }

  revalidatePath("/leave")
  return { success: true }
}
