"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addCompensationHistory(formData: FormData) {
  const supabase = await createClient()

  const employee_id = formData.get("employee_id") as string
  const basic_salary = parseFloat(formData.get("basic_salary") as string)
  const pay_frequency = formData.get("pay_frequency") as string
  const effective_from = formData.get("effective_from") as string

  if (!employee_id || !basic_salary || !pay_frequency || !effective_from) {
    return { error: "Missing required fields" }
  }

  const salary_type = pay_frequency; 
  
  // Calculate standard daily rate based on frequency (using 261 days/year)
  let annualized_salary = 0;
  switch (pay_frequency) {
    case 'Weekly':
      annualized_salary = basic_salary * 52;
      break;
    case 'Bi-weekly':
      annualized_salary = basic_salary * 26;
      break;
    case 'Semi-monthly':
      annualized_salary = basic_salary * 24;
      break;
    case 'Monthly':
      annualized_salary = basic_salary * 12;
      break;
    case 'Daily':
      annualized_salary = basic_salary * 261;
      break;
    default:
      annualized_salary = basic_salary * 12; // Fallback
  }

  const daily_rate = annualized_salary / 261;
  const hourly_rate = daily_rate / 8;

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

    // Update the previous record's effective_to date
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
      salary_type,
      basic_salary,
      pay_frequency,
      effective_from,
      daily_rate: Number(daily_rate.toFixed(2)),
      hourly_rate: Number(hourly_rate.toFixed(2)),
      working_hours_per_day: 8,
      working_days_per_week: 5
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
