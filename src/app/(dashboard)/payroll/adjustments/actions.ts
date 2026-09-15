"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createPayrollAdjustment(data: {
  employeeId: string,
  referenceItemId?: string,
  adjustmentType: string,
  category: string,
  amount: number,
  reason: string
}) {
  const supabase = await createClient()

  const { error } = await supabase.from('payroll_adjustments').insert({
    employee_id: data.employeeId,
    reference_payroll_item_id: data.referenceItemId || null,
    adjustment_type: data.category, // 'Earning' or 'Deduction'
    description: data.adjustmentType, // e.g. 'Hours Correction'
    amount: data.amount,
    reason: data.reason,
    status: 'Pending'
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/payroll/adjustments')
  return { success: true }
}

export async function approvePayrollAdjustment(adjustmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('payroll_adjustments')
    .update({ 
      status: 'Approved',
      approved_by: user?.id,
      approved_at: new Date().toISOString()
    })
    .eq('id', adjustmentId)
    .eq('status', 'Pending')

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/payroll/adjustments')
  return { success: true }
}

export async function deletePayrollAdjustment(adjustmentId: string) {
  const supabase = await createClient()
  
  // Only allow deleting Pending adjustments
  const { error } = await supabase
    .from('payroll_adjustments')
    .delete()
    .eq('id', adjustmentId)
    .eq('status', 'Pending')

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/payroll/adjustments')
  return { success: true }
}
