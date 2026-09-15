"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function approvePayrollRun(payrollRunId: string, overrideReason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 0. Reconciliation Check
  const { data: runItems, error: itemsErr } = await supabase
    .from('payroll_items')
    .select('id, gross_pay, net_pay, total_deductions, payroll_earnings(amount), payroll_deductions(amount)')
    .eq('payroll_run_id', payrollRunId)

  if (itemsErr) return { error: itemsErr.message }

  for (const item of runItems || []) {
    const sumEarnings = item.payroll_earnings.reduce((sum: number, e: any) => sum + Number(e.amount), 0)
    const sumDeductions = item.payroll_deductions.reduce((sum: number, d: any) => sum + Number(d.amount), 0)
    
    // Allow small floating point differences, max 0.05
    if (Math.abs(Number(item.gross_pay) - sumEarnings) > 0.05) {
      return { error: `Reconciliation failed: Gross pay ${item.gross_pay} does not match sum of earnings ${sumEarnings} for item ${item.id}.` }
    }
    
    if (Math.abs(Number(item.gross_pay) - Number(item.total_deductions) - Number(item.net_pay)) > 0.05) {
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

  const finalReason = overrideReason ? `Approved with warnings override: ${overrideReason}` : 'Approved by authorized user';

  // 2. Insert Status History
  await supabase
    .from('payroll_status_history')
    .insert({
      payroll_run_id: payrollRunId,
      status: 'Approved',
      changed_by: user?.id,
      reason: finalReason
    })

  // 3. Insert Audit Log
  await supabase
    .from('audit_logs')
    .insert({
      user_id: user?.id,
      action: 'PAYROLL_APPROVED',
      entity_type: 'payroll_runs',
      entity_id: payrollRunId,
      reason: finalReason
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

  // 1. Fetch current status to ensure we don't process multiple times
  const { data: runData } = await supabase.from('payroll_runs').select('status').eq('id', payrollRunId).single()
  if (!runData) return { error: 'Run not found' }
  if (runData.status === 'Paid') return { success: true } // Already paid

  // 2. Process Cash Advances
  // Find all cash advance deductions for this run
  const { data: items } = await supabase
    .from('payroll_items')
    .select('id')
    .eq('payroll_run_id', payrollRunId)

  if (items && items.length > 0) {
    const itemIds = items.map(i => i.id)
    const { data: deductions } = await supabase
      .from('payroll_deductions')
      .select('amount, source_id')
      .in('payroll_item_id', itemIds)
      .eq('source', 'Cash Advance')

    if (deductions && deductions.length > 0) {
      // Check if repayments already exist for this run to prevent duplicates
      const { data: existingRepayments } = await supabase
        .from('cash_advance_repayments')
        .select('id')
        .eq('payroll_run_id', payrollRunId)

      if (!existingRepayments || existingRepayments.length === 0) {
        // Insert repayments and update balances
        for (const ded of deductions) {
          if (ded.source_id) {
            // Insert repayment
            await supabase.from('cash_advance_repayments').insert({
              cash_advance_id: ded.source_id,
              payroll_run_id: payrollRunId,
              amount: ded.amount,
              repayment_date: new Date().toISOString()
            })
            // Update balance
            // We read the current balance first
            const { data: caData } = await supabase
              .from('cash_advances')
              .select('remaining_balance')
              .eq('id', ded.source_id)
              .single()
            
            if (caData) {
              let newBalance = Number(caData.remaining_balance) - Number(ded.amount)
              if (newBalance < 0) newBalance = 0
              
              let newStatus = newBalance === 0 ? 'Fully Paid' : 'Partially Paid'
              
              await supabase
                .from('cash_advances')
                .update({ 
                  remaining_balance: newBalance,
                  status: newStatus
                })
                .eq('id', ded.source_id)
            }
          }
        }
      }
    }
  }

  // 3. Update status to 'Paid'
  const { error } = await supabase
    .from('payroll_runs')
    .update({ 
      status: 'Paid'
    })
    .eq('id', payrollRunId)

  if (error) return { error: error.message }

  // 4. Insert Status History
  await supabase
    .from('payroll_status_history')
    .insert({
      payroll_run_id: payrollRunId,
      status: 'Paid',
      changed_by: user?.id,
      reason: 'Marked as disbursed to employees'
    })

  // 5. Insert Audit Log
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

export async function submitDraftForApproval(payrollRunId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('payroll_runs')
    .update({ status: 'Pending Approval' })
    .eq('id', payrollRunId)
    .eq('status', 'Draft')

  if (error) return { error: error.message }

  await supabase.from('payroll_status_history').insert({
    payroll_run_id: payrollRunId,
    status: 'Pending Approval',
    changed_by: user?.id,
    reason: 'Draft submitted for approval'
  })

  revalidatePath(`/payroll/${payrollRunId}`)
  revalidatePath('/payroll')
  return { success: true }
}

export async function deleteDraft(payrollRunId: string) {
  const supabase = await createClient()
  console.log("Attempting to delete draft:", payrollRunId)

  // Must only delete if it's a draft
  const { data, error, count } = await supabase
    .from('payroll_runs')
    .delete({ count: 'exact' })
    .eq('id', payrollRunId)
    .eq('status', 'Draft')
    .select()

  console.log("Delete draft result:", { data, error, count })

  if (error) return { error: error.message }
  if (count === 0) return { error: "Deletion failed: Row not found, not in Draft status, or permission denied." }

  return { success: true }
}
