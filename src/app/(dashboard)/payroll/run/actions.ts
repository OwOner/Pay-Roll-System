"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { loadPayrollContext } from "@/lib/payroll/service"
import { calculatePayroll } from "@/lib/payroll/engine"

export async function previewPayrollRun(formData: FormData) {
  const supabase = await createClient()
  
  const start = formData.get('period_start') as string
  const end = formData.get('period_end') as string
  const freq = formData.get('pay_frequency') as string
  const payDate = formData.get('pay_date') as string

  // Validate dates
  if (new Date(start) >= new Date(end)) {
    return { error: "Start date must be before end date." }
  }
  if (new Date(payDate) < new Date(end)) {
    return { error: "Pay date must be on or after the period end date." }
  }

  // Check for duplicates
  const { data: existing } = await supabase
    .from('payroll_periods')
    .select('id')
    .eq('period_start', start)
    .eq('period_end', end)
    .eq('pay_frequency', freq)
    .single()

  if (existing) {
    return { error: "A payroll run for this exact period and frequency already exists." }
  }

  // Find active employees
  const { data: activeEmployees } = await supabase
    .from('employees')
    .select('id, first_name, last_name, employment_type')
    .eq('employment_status', 'Active')

  if (!activeEmployees || activeEmployees.length === 0) {
    return { error: "No active employees found to process." }
  }

  // Calculate payroll for each employee using the deterministic engine
  const previewResults = [];
  
  for (const emp of activeEmployees) {
    try {
      const context = await loadPayrollContext(emp.id, start, end, freq as any);
      const result = calculatePayroll(context);
      
      previewResults.push({
        employee_id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        gross_pay: result.gross_pay.toNumber(),
        total_deductions: result.total_employee_deductions.toNumber(),
        net_pay: result.net_pay.toNumber(),
        status: 'Ready'
      });
    } catch (err: any) {
      previewResults.push({
        employee_id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        gross_pay: 0,
        total_deductions: 0,
        net_pay: 0,
        status: `Error: ${err.message}`
      });
    }
  }

  return { success: true, preview: previewResults }
}

export async function submitPayrollRun(formData: FormData, status: 'Draft' | 'Pending Approval') {
  const supabase = await createClient()
  
  const start = formData.get('period_start') as string
  const end = formData.get('period_end') as string
  const freq = formData.get('pay_frequency') as string
  const payDate = formData.get('pay_date') as string

  // Get current user for audit
  const { data: { user } } = await supabase.auth.getUser()
  
  // 1. Create Period
  const { data: period, error: pErr } = await supabase
    .from('payroll_periods')
    .insert({
      period_start: start,
      period_end: end,
      pay_frequency: freq,
      pay_date: payDate
    })
    .select('id')
    .single()

  if (pErr) return { error: pErr.message }

  // 2. Create Run
  const { data: run, error: rErr } = await supabase
    .from('payroll_runs')
    .insert({
      payroll_period_id: period.id,
      status: status,
      created_by: user?.id
    })
    .select('id')
    .single()

  if (rErr) return { error: rErr.message }

  // 3. Log to Status History
  await supabase
    .from('payroll_status_history')
    .insert({
      payroll_run_id: run.id,
      status: status,
      changed_by: user?.id,
      reason: status === 'Draft' ? 'Initial Draft Save' : 'Submitted for Approval'
    })

  // 4. Audit Log (Sensitive Mutation)
  await supabase
    .from('audit_logs')
    .insert({
      user_id: user?.id,
      action: status === 'Draft' ? 'PAYROLL_DRAFTED' : 'PAYROLL_SUBMITTED',
      entity_type: 'payroll_runs',
      entity_id: run.id,
      reason: `Payroll ${status} generated`
    })

  // 5. Calculate and insert payroll items
  const activeEmployees = await supabase
    .from('employees')
    .select('id, first_name, last_name, employment_type')
    .eq('employment_status', 'Active')

  if (activeEmployees.data && activeEmployees.data.length > 0) {
    for (const emp of activeEmployees.data) {
      try {
        const context = await loadPayrollContext(emp.id, start, end, freq as any);
        const result = calculatePayroll(context);
        
          const { data: payrollItem, error: itemErr } = await supabase
            .from('payroll_items')
            .insert({
              payroll_run_id: run.id,
              employee_id: emp.id,
              gross_pay: result.gross_pay.toNumber(),
              taxable_income: result.taxable_compensation.toNumber(),
              non_taxable_income: result.non_taxable_compensation.toNumber(),
              total_deductions: result.total_employee_deductions.toNumber(),
              net_pay: result.net_pay.toNumber(),
              withholding_tax: result.withholding_tax.toNumber(),
              calculation_engine_version: result.calculation_engine_version,
            })
            .select('id')
            .single()

        if (!itemErr && payrollItem) {
          // Insert earnings
          if (result.earnings.length > 0) {
            await supabase.from('payroll_earnings').insert(
              result.earnings.map(e => ({
                payroll_item_id: payrollItem.id,
                earning_type: e.type,
                description: e.description,
                amount: e.amount.toNumber(),
                is_taxable: e.is_taxable,
                calculated_amount: e.calculated_amount ? e.calculated_amount.toNumber() : e.amount.toNumber()
              }))
            )
          }

          // Insert deductions
          if (result.deductions.length > 0) {
            await supabase.from('payroll_deductions').insert(
              result.deductions.map(d => ({
                payroll_item_id: payrollItem.id,
                deduction_type: d.type,
                description: d.description,
                amount: d.amount.toNumber(),
                employer_amount: d.employer_amount ? d.employer_amount.toNumber() : 0,
                calculated_amount: d.calculated_amount ? d.calculated_amount.toNumber() : d.amount.toNumber()
              }))
            )
          }
        }
      } catch (err: any) {
        console.error(`Error calculating payroll for employee ${emp.id}:`, err);
      }
    }
  }

  revalidatePath('/payroll')
  redirect('/payroll')
}
