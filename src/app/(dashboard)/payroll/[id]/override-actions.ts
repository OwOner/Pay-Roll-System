"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Override a payroll earning's monetary amount.
 * 
 * Rules:
 * - The original `amount` is preserved into `calculated_amount` if not already set.
 * - The new `amount` reflects the override.
 * - `override_reason`, `override_by`, `override_at` are recorded.
 * - The parent `payroll_item` gross_pay and net_pay are recalculated.
 * - Historical overrides (override_by, override_at, override_reason) are never destroyed.
 */
export async function overridePayrollEarning(
  earningId: string,
  newAmount: number,
  overrideReason: string,
  payrollRunId: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "Unauthorized" }
  if (!overrideReason.trim()) return { success: false, error: "Override reason is required." }
  if (isNaN(newAmount) || newAmount < 0) return { success: false, error: "Invalid override amount." }

  // 1. Fetch the current earning
  const { data: earning, error: fetchErr } = await supabase
    .from("payroll_earnings")
    .select("id, payroll_item_id, amount, calculated_amount, description")
    .eq("id", earningId)
    .single()

  if (fetchErr || !earning) {
    return { success: false, error: "Earning record not found." }
  }

  // 2. Preserve the calculated amount if not already set
  const calculatedAmount =
    earning.calculated_amount !== null ? earning.calculated_amount : earning.amount

  // 3. Update the earning with the override
  const { error: updateErr } = await supabase
    .from("payroll_earnings")
    .update({
      amount: newAmount,
      calculated_amount: calculatedAmount,
      override_reason: overrideReason.trim(),
      override_by: user.id,
      override_at: new Date().toISOString(),
    })
    .eq("id", earningId)

  if (updateErr) {
    return { success: false, error: updateErr.message }
  }

  // 4. Recalculate gross_pay and net_pay for the parent payroll_item
  const { data: allEarnings, error: earningsErr } = await supabase
    .from("payroll_earnings")
    .select("amount")
    .eq("payroll_item_id", earning.payroll_item_id)

  if (earningsErr) {
    return { success: false, error: "Failed to recalculate totals: " + earningsErr.message }
  }

  const newGrossPay = (allEarnings || []).reduce(
    (sum, e) => sum + Number(e.amount),
    0
  )

  // Fetch current deductions total
  const { data: allDeductions } = await supabase
    .from("payroll_deductions")
    .select("amount")
    .eq("payroll_item_id", earning.payroll_item_id)

  const totalDeductions = (allDeductions || []).reduce(
    (sum, d) => sum + Number(d.amount),
    0
  )

  const newNetPay = newGrossPay - totalDeductions

  const { error: itemUpdateErr } = await supabase
    .from("payroll_items")
    .update({
      gross_pay: newGrossPay,
      net_pay: newNetPay,
    })
    .eq("id", earning.payroll_item_id)

  if (itemUpdateErr) {
    return { success: false, error: "Failed to update payroll totals: " + itemUpdateErr.message }
  }

  revalidatePath(`/payroll/${payrollRunId}`)
  return { success: true }
}

/**
 * Revert an overridden earning back to its calculated amount.
 */
export async function revertPayrollEarningOverride(earningId: string, payrollRunId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "Unauthorized" }

  const { data: earning, error: fetchErr } = await supabase
    .from("payroll_earnings")
    .select("id, payroll_item_id, amount, calculated_amount")
    .eq("id", earningId)
    .single()

  if (fetchErr || !earning) {
    return { success: false, error: "Earning record not found." }
  }

  if (earning.calculated_amount === null) {
    return { success: false, error: "No override found to revert." }
  }

  // Restore amount to calculated_amount
  const { error: updateErr } = await supabase
    .from("payroll_earnings")
    .update({
      amount: earning.calculated_amount,
      calculated_amount: null,
      override_reason: null,
      override_by: null,
      override_at: null,
    })
    .eq("id", earningId)

  if (updateErr) return { success: false, error: updateErr.message }

  // Recalculate totals
  const { data: allEarnings } = await supabase
    .from("payroll_earnings")
    .select("amount")
    .eq("payroll_item_id", earning.payroll_item_id)

  const newGrossPay = (allEarnings || []).reduce((sum, e) => sum + Number(e.amount), 0)

  const { data: allDeductions } = await supabase
    .from("payroll_deductions")
    .select("amount")
    .eq("payroll_item_id", earning.payroll_item_id)

  const totalDeductions = (allDeductions || []).reduce((sum, d) => sum + Number(d.amount), 0)

  await supabase
    .from("payroll_items")
    .update({ gross_pay: newGrossPay, net_pay: newGrossPay - totalDeductions })
    .eq("id", earning.payroll_item_id)

  revalidatePath(`/payroll/${payrollRunId}`)
  return { success: true }
}
