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

  // 0.5 Adjustment Double-Count Check
  const itemIds = runItems?.map(i => i.id) || [];
  if (itemIds.length > 0) {
    const { data: adjEarnings } = await supabase
      .from('payroll_earnings')
      .select('source_id')
      .eq('source', 'payroll_adjustments')
      .in('payroll_item_id', itemIds)

    const { data: adjDeductions } = await supabase
      .from('payroll_deductions')
      .select('source_id')
      .eq('source', 'payroll_adjustments')
      .in('payroll_item_id', itemIds)
      
    const sourceIds = [...(adjEarnings || []), ...(adjDeductions || [])]
      .map(a => a.source_id)
      .filter(Boolean);
    
    if (sourceIds.length > 0) {
      const { data: processedAdjs } = await supabase
        .from('payroll_adjustments')
        .select('id')
        .in('id', sourceIds)
        .eq('status', 'Processed')
        
      if (processedAdjs && processedAdjs.length > 0) {
        return { error: 'This run contains adjustments that have already been processed in another approved run. Please reject or delete this run and regenerate it to ensure accurate adjustment balances.' }
      }
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

export async function markPayrollPaid(payrollRunId: string, paymentReference?: string) {
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
      status: 'Paid',
      paid_at: new Date().toISOString()
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
      reason: 'Marked as disbursed to employees',
      payment_reference: paymentReference || null
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

export async function checkStatutoryConfiguration(payrollRunId: string) {
  const supabase = await createClient()
  
  // 1. Get the payroll run and period
  const { data: run } = await supabase
    .from('payroll_runs')
    .select(`
      payroll_period_id,
      payroll_periods (
        id,
        statutory_configuration_status,
        statutory_schedule_id,
        period_start,
        period_end,
        pay_frequency
      )
    `)
    .eq('id', payrollRunId)
    .single()

  if (!run || !run.payroll_periods) return { success: false, error: 'Run not found' }
  const period = run.payroll_periods as any

  if (period.statutory_configuration_status !== 'Pending') {
    return { success: true, pending: false, status: period.statutory_configuration_status }
  }

  // 2. Fetch employees in this run
  const { data: items } = await supabase
    .from('payroll_items')
    .select('employee_id')
    .eq('payroll_run_id', payrollRunId)

  if (!items || items.length === 0) return { success: true, pending: false, status: period.statutory_configuration_status }

  const employeeIds = items.map(i => i.employee_id)

  // 3. Check their statutory profiles
  const { data: profiles } = await supabase
    .from('employee_statutory_profiles')
    .select('*')
    .in('employee_id', employeeIds)
    
  let sssCount = 0
  let phicCount = 0
  let hdmfCount = 0

  if (profiles) {
    for (const empId of employeeIds) {
      const empProfiles = profiles.filter((p: any) => p.employee_id === empId)
      const effective = empProfiles.find((p: any) => !p.effective_to || new Date(p.effective_to) >= new Date(period.period_start))
      if (effective) {
        if (effective.sss_applicable) sssCount++
        if (effective.philhealth_applicable) phicCount++
        if (effective.pagibig_applicable) hdmfCount++
      }
    }
  }

  const eligibleEmployeesCount = Math.max(sssCount, phicCount, hdmfCount)
  const hasEligible = eligibleEmployeesCount > 0

  if (!hasEligible) {
    // Automatically mark as 'Not Required'
    await supabase.from('payroll_periods').update({ statutory_configuration_status: 'Not Required' }).eq('id', period.id)
    return { success: true, pending: false, status: 'Not Required' }
  }

  return {
    success: true,
    pending: true,
    status: 'Pending',
    eligibleEmployeesCount,
    breakdown: { sss: sssCount, philhealth: phicCount, pagibig: hdmfCount },
    period: period
  }
}

export async function setStatutoryConfigurationStatus(periodId: string, status: string, reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('payroll_periods')
    .update({ statutory_configuration_status: status })
    .eq('id', periodId)

  if (error) return { success: false, error: error.message }

  // If skipped intentionally, record in audit logs
  if (status === 'Intentionally Skipped' && reason) {
    await supabase.from('audit_logs').insert({
      user_id: user?.id,
      action: 'STATUTORY_SKIPPED',
      entity_type: 'payroll_periods',
      entity_id: periodId,
      reason: `Intentionally skipped statutory deductions. Reason: ${reason}`
    })
  }

  return { success: true }
}

export async function togglePayrollItemExclusion(itemId: string, runId: string, exclude: boolean, reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const payload = exclude ? {
    is_excluded: true,
    exclusion_reason: reason || null,
    excluded_by: user?.id,
    excluded_at: new Date().toISOString()
  } : {
    is_excluded: false,
    exclusion_reason: null,
    excluded_by: null,
    excluded_at: null
  }

  const { error } = await supabase
    .from('payroll_items')
    .update(payload)
    .eq('id', itemId)

  if (error) {
    console.error("Error toggling item exclusion:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/payroll/${runId}`)
  return { success: true }
}

