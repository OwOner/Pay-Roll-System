"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function approvePayrollRun(payrollRunId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 0. Reconciliation Check
  const { data: runItems, error: itemsErr } = await supabase
    .from('payroll_items')
    .select('id, gross_pay, net_pay, total_employee_deductions, payroll_earnings(amount), payroll_deductions(amount)')
    .eq('payroll_run_id', payrollRunId)

  if (itemsErr) return { error: itemsErr.message }

  for (const item of runItems || []) {
    const sumEarnings = item.payroll_earnings.reduce((sum: number, e: any) => sum + Number(e.amount), 0)
    const sumDeductions = item.payroll_deductions.reduce((sum: number, d: any) => sum + Number(d.amount), 0)
    
    // Allow small floating point differences, max 0.05
    if (Math.abs(Number(item.gross_pay) - sumEarnings) > 0.05) {
      return { error: `Reconciliation failed: Gross pay ${item.gross_pay} does not match sum of earnings ${sumEarnings} for item ${item.id}.` }
    }
    
    if (Math.abs(Number(item.gross_pay) - Number(item.total_employee_deductions) - Number(item.net_pay)) > 0.05) {
      return { error: `Reconciliation failed: Net pay calculation mismatch for item ${item.id}.` }
    }
  }

  // 1. Update status to 'Approved' and set approved_by
  const { error } = await supabase
    .from('payroll_runs')
    .update({ 
      status: 'Approved',
      approved_by: user?.id,
      approved_at: new Date().toISOString()
    })
    .eq('id', payrollRunId)

  if (error) return { error: error.message }

  // 2. Insert Status History
  await supabase
    .from('payroll_status_history')
    .insert({
      payroll_run_id: payrollRunId,
      status: 'Approved',
      changed_by: user?.id,
      reason: 'Approved by authorized user'
    })

  // 3. Insert Audit Log
  await supabase
    .from('audit_logs')
    .insert({
      user_id: user?.id,
      action: 'PAYROLL_APPROVED',
      entity_type: 'payroll_runs',
      entity_id: payrollRunId,
      reason: 'Payroll approved and locked.'
    })

  revalidatePath(`/payroll/${payrollRunId}`)
  revalidatePath('/payroll')
  return { success: true }
}

export async function rejectPayrollRun(payrollRunId: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Update status to 'Rejected'
  const { error } = await supabase
    .from('payroll_runs')
    .update({ 
      status: 'Rejected'
    })
    .eq('id', payrollRunId)

  if (error) return { error: error.message }

  // 2. Insert Status History
  await supabase
    .from('payroll_status_history')
    .insert({
      payroll_run_id: payrollRunId,
      status: 'Rejected',
      changed_by: user?.id,
      reason: reason
    })

  // 3. Insert Audit Log
  await supabase
    .from('audit_logs')
    .insert({
      user_id: user?.id,
      action: 'PAYROLL_REJECTED',
      entity_type: 'payroll_runs',
      entity_id: payrollRunId,
      reason: reason
    })

  revalidatePath(`/payroll/${payrollRunId}`)
  revalidatePath('/payroll')
  return { success: true }
}

export async function markPayrollPaid(payrollRunId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Update status to 'Paid'
  const { error } = await supabase
    .from('payroll_runs')
    .update({ 
      status: 'Paid'
    })
    .eq('id', payrollRunId)

  if (error) return { error: error.message }

  // 2. Insert Status History
  await supabase
    .from('payroll_status_history')
    .insert({
      payroll_run_id: payrollRunId,
      status: 'Paid',
      changed_by: user?.id,
      reason: 'Marked as disbursed to employees'
    })

  // 3. Insert Audit Log
  await supabase
    .from('audit_logs')
    .insert({
      user_id: user?.id,
      action: 'PAYROLL_PAID',
      entity_type: 'payroll_runs',
      entity_id: payrollRunId,
      reason: 'Payroll disbursement completed.'
    })

  revalidatePath(`/payroll/${payrollRunId}`)
  revalidatePath('/payroll')
  return { success: true }
}
