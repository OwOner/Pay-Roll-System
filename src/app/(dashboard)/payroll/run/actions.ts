"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { loadPayrollContext } from "@/lib/payroll/service"
import { calculatePayroll } from "@/lib/payroll/engine"
import { getOrCreatePayrollPeriod } from "@/app/(dashboard)/attendance/timesheet-actions"

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

  // Get or Create the authoritative period ID
  let periodId: string;
  try {
    const period = await getOrCreatePayrollPeriod(start, end, freq);
    periodId = period.id;
  } catch (err: any) {
    return { error: `Failed to resolve payroll period: ${err.message}` };
  }

  // Check for duplicate runs
  const { data: existingRun } = await supabase
    .from('payroll_runs')
    .select('id')
    .eq('payroll_period_id', periodId)
    .limit(1)
    
  if (existingRun && existingRun.length > 0) {
    return { error: "A payroll run for this exact period and frequency already exists." }
  }

  // Find active employees
  const { data: activeEmployees } = await supabase
    .from('employees')
    .select('id, first_name, last_name, employment_type')
    .eq('employment_status', 'Active')
    .eq('is_payroll_exempt', false)

  if (!activeEmployees || activeEmployees.length === 0) {
    return { error: "No active, non-exempt employees found to process." }
  }



  // Calculate payroll for each employee using the deterministic engine
  const previewResults = [];
  
  for (const emp of activeEmployees) {
    try {
      const context = await loadPayrollContext(emp.id, start, end, freq as any);
      const result = calculatePayroll(context, context.activePolicy);
      
      previewResults.push({
        employee_id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        gross_pay: result.gross_pay.toNumber(),
        total_deductions: result.total_employee_deductions.toNumber(),
        net_pay: result.net_pay.toNumber(),
        status: 'Ready',
        earnings: result.earnings.map(e => ({
          type: e.type,
          description: e.description,
          amount: e.amount.toNumber()
        })),
        deductions: result.deductions.map(d => ({
          type: d.type,
          description: d.description,
          amount: d.amount.toNumber()
        }))
      });
    } catch (err: any) {
      previewResults.push({
        employee_id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        gross_pay: 0,
        total_deductions: 0,
        net_pay: 0,
        status: `Error: ${err.message}`,
        earnings: [],
        deductions: []
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
  
  // 1. Get or Create Period
  let period;
  try {
    period = await getOrCreatePayrollPeriod(start, end, freq);
  } catch (err: any) {
    return { error: `Failed to resolve payroll period: ${err.message}` };
  }

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
        const result = calculatePayroll(context, context.activePolicy);
        
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
                description: d.description,
                amount: d.amount.toNumber(),
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
