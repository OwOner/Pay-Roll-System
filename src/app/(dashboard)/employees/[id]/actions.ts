"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addCompensationHistory(formData: FormData) {
  const supabase = await createClient()

  const employee_id = formData.get("employee_id") as string
  const salary_basis = formData.get("salary_basis") as string  // Monthly | Daily | Weekly | Hourly
  const rate = parseFloat(formData.get("rate") as string)      // the raw rate in its basis unit
  const pay_frequency = formData.get("pay_frequency") as string
  const effective_from = formData.get("effective_from") as string

  if (!employee_id || !salary_basis || !rate || !pay_frequency || !effective_from) {
    return { error: "Missing required fields" }
  }

  if (!['Monthly', 'Daily', 'Weekly', 'Hourly'].includes(salary_basis)) {
    return { error: `Invalid salary basis: "${salary_basis}". Must be Monthly, Daily, Weekly, or Hourly.` }
  }

  // Store only the authoritative rate column for the chosen basis.
  // The payroll engine derives hourly/daily equivalents using the resolved Work Policy.
  // We do NOT hardcode divisors like 261 here — that's policy-dependent.
  const rateColumns: Record<string, object> = {
    Monthly: {
      basic_salary: rate,
      daily_rate: null,
      weekly_rate: null,
      hourly_rate: null,
    },
    Daily: {
      basic_salary: rate,   // stored here too so NOT NULL constraint is satisfied
      daily_rate: rate,
      weekly_rate: null,
      hourly_rate: null,
    },
    Weekly: {
      basic_salary: rate,   // stored here too so NOT NULL constraint is satisfied
      daily_rate: null,
      weekly_rate: rate,
      hourly_rate: null,
    },
    Hourly: {
      basic_salary: rate,   // stored here too so NOT NULL constraint is satisfied
      daily_rate: null,
      weekly_rate: null,
      hourly_rate: rate,
    },
  }

  // First, get the most recent compensation to check dates
  const { data: previousComps, error: fetchError } = await supabase
    .from('employee_compensation_history')
    .select('*')
    .eq('employee_id', employee_id)
    .order('effective_from', { ascending: false })

  if (fetchError) {
    return { error: fetchError.message }
  }

  const mostRecent = previousComps && previousComps.length > 0 ? previousComps[0] : null;

  if (mostRecent) {
    const newDate = new Date(effective_from);
    const oldDate = new Date(mostRecent.effective_from);

    if (newDate <= oldDate) {
      return { error: "New effective date must be strictly after the most recent compensation's effective date." }
    }

    // Cap the previous record
    const effectiveToDate = new Date(newDate);
    effectiveToDate.setDate(effectiveToDate.getDate() - 1);

    const { error: updateError } = await supabase
      .from('employee_compensation_history')
      .update({ effective_to: effectiveToDate.toISOString().split('T')[0] })
      .eq('id', mostRecent.id)

    if (updateError) {
      return { error: "Failed to cap previous compensation period." }
    }
  }

  // Insert the new record
  const { error: insertError } = await supabase
    .from('employee_compensation_history')
    .insert({
      employee_id,
      salary_basis,
      salary_type: salary_basis,  // keep in sync for backward compat
      pay_frequency,
      effective_from,
      working_hours_per_day: 8,
      working_days_per_week: 5,
      ...rateColumns[salary_basis],
    })

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath(`/employees/${employee_id}`)
  return { success: true }
}

export async function fetchEmployeeAttendance(employeeId: string, startDate: string, endDate: string) {
  const supabase = await createClient()
  
  const { data: records, error } = await supabase
    .from('attendance_records')
    .select('*, projects(project_name)')
    .eq('employee_id', employeeId)
    .gte('work_date', startDate)
    .lte('work_date', endDate)
    .order('work_date', { ascending: false })
    
  if (error) {
    console.error("Error fetching employee attendance:", error)
    return []
  }
  
  return records || []
}

export async function assignEmployeeWorkPolicy(payload: {
  employee_id: string,
  work_policy_id: string,
  effective_from: string,
  effective_to?: string
}) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("employee_work_policies")
    .insert([{
      employee_id: payload.employee_id,
      work_policy_id: payload.work_policy_id,
      effective_from: payload.effective_from,
      effective_to: payload.effective_to || null
    }])

  if (error) {
    console.error("Error assigning work policy:", error)
    return { error: error.message }
  }

  revalidatePath(`/employees/${payload.employee_id}`)
  return { success: true }
}

export async function removeEmployeeWorkPolicy(assignmentId: string, employeeId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("employee_work_policies")
    .delete()
    .eq("id", assignmentId)

  if (error) {
    console.error("Error removing work policy:", error)
    return { error: error.message }
  }

  revalidatePath(`/employees/${employeeId}`)
  return { success: true }
}

export async function updateEmployeeWorkPolicy(assignmentId: string, employeeId: string, payload: {
  work_policy_id: string,
  effective_from: string,
  effective_to?: string
}) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("employee_work_policies")
    .update({
      work_policy_id: payload.work_policy_id,
      effective_from: payload.effective_from,
      effective_to: payload.effective_to || null
    })
    .eq("id", assignmentId)

  if (error) {
    console.error("Error updating work policy assignment:", error)
    return { error: error.message }
  }

  revalidatePath(`/employees/${employeeId}`)
  return { success: true }
}

export async function togglePayrollExemption(employeeId: string, isExempt: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('employees')
    .update({ is_payroll_exempt: isExempt })
    .eq('id', employeeId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/employees/${employeeId}`)
  return { success: true }
}
