"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { parseISO, eachDayOfInterval, format } from "date-fns"
import Decimal from "decimal.js"

export async function getPayrollPeriod(periodStart: string, periodEnd: string, payFrequency: string) {
  const supabase = await createClient()
  
  const { data: existing } = await supabase
    .from('payroll_periods')
    .select('*')
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .eq('pay_frequency', payFrequency)
    .single()

  return existing || null
}

export async function createPayrollPeriod(data: {
  period_start: string
  period_end: string
  pay_frequency: string
}) {
  const supabase = await createClient()

  const { data: newPeriod, error: insertErr } = await supabase
    .from('payroll_periods')
    .insert({
      period_start: data.period_start,
      period_end: data.period_end,
      pay_frequency: data.pay_frequency,
      pay_date: data.period_end, // default
      statutory_configuration_status: 'Pending'
    })
    .select()
    .single()

  if (insertErr) return { success: false, error: insertErr.message }
  return { success: true, period: newPeriod }
}

export async function updatePayrollPeriodConfig(periodId: string, data: {
  statutory_schedule_id: string
  period_sequence: number
  contribution_month: string
}) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('payroll_periods')
    .update({
      statutory_schedule_id: data.statutory_schedule_id,
      period_sequence: data.period_sequence,
      contribution_month: data.contribution_month
    })
    .eq('id', periodId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function getActiveSchedules(payFrequency: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('company_statutory_schedules')
    .select('id, name')
    .eq('pay_frequency', payFrequency)
    .eq('is_active', true)
    
  return data || []
}

export async function fetchTimesheets(payrollPeriodId: string) {
  const supabase = await createClient()

  const { data: timesheets, error } = await supabase
    .from('timesheets')
    .select(`
      *,
      employees (id, first_name, last_name, employee_code, work_schedule),
      timesheet_details (*)
    `)
    .eq('payroll_period_id', payrollPeriodId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching timesheets:", error)
    return { success: false, error: error.message }
  }

  return { success: true, timesheets }
}

export async function generateTimesheets(payrollPeriodId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // 1. Fetch Payroll Period
  const { data: period } = await supabase
    .from('payroll_periods')
    .select('*')
    .eq('id', payrollPeriodId)
    .single()

  if (!period) return { success: false, error: 'Invalid payroll period.' }

  // 2. Fetch all active employees with their effective work policies
  const { data: employees } = await supabase
    .from('employees')
    .select(`
      id, 
      work_schedule,
      positions(default_work_policy_id),
      employee_work_policies(work_policy_id, effective_from, effective_to)
    `)
    .eq('employment_status', 'Active')

  if (!employees || employees.length === 0) {
    return { success: false, error: 'No active employees found.' }
  }

  // Fetch holidays for day type resolution
  const { data: holidays } = await supabase.from('holidays').select('*').gte('date', period.period_start).lte('date', period.period_end) || { data: [] }
  const holidayList = holidays || []

  // Fetch all work policies to resolve rules
  const { data: workPolicies } = await supabase.from('work_policies').select('*') || { data: [] }
  const policyMap = new Map(workPolicies?.map(p => [p.id, p]) || [])

  // 3. Process each employee
  let generated = 0
  let skipped = 0

  for (const emp of employees) {
    // Check if Approved timesheet exists
    const { data: existing } = await supabase
      .from('timesheets')
      .select('id, status, total_regular_hours')
      .eq('employee_id', emp.id)
      .eq('payroll_period_id', payrollPeriodId)
      .single()

    if (existing && existing.status === 'Approved') {
      // Skip truly approved timesheets (with real hours), but allow re-generating
      // ones that were approved with 0 hours (approved before attendance was imported)
      const hasHours = (existing.total_regular_hours ?? 0) > 0
      if (hasHours) {
        skipped++
        continue
      }
    }

    // Resolve Work Policy for this employee for this period start date
    // Note: robust implementation would check date-by-date, but checking period start is a reasonable proxy
    let activePolicyId = (emp.positions as any)?.default_work_policy_id
    if (emp.employee_work_policies && emp.employee_work_policies.length > 0) {
      // Find active policy (simplistic: no effective_to or effective_to > period_start)
      const specific = emp.employee_work_policies.find((ewp: any) => !ewp.effective_to || new Date(ewp.effective_to) >= new Date(period.period_start))
      if (specific) activePolicyId = specific.work_policy_id
    }
    const policy = activePolicyId ? policyMap.get(activePolicyId) : null
    const requiresApproval = policy ? policy.requires_ot_approval : true
    const scheduledHours = policy ? policy.scheduled_hours_per_day : 8.00
    const restDays = policy ? (policy.rest_days || []) : ["Sunday"]

    // Fetch Attendance
    const { data: attendance } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', emp.id)
      .gte('work_date', period.period_start)
      .lte('work_date', period.period_end)

    let total_regular_hours = new Decimal(0)
    let total_recorded_ot = new Decimal(0)
    let total_payable_ot = new Decimal(0)
    let total_recorded_ut = new Decimal(0) // Not heavily populated yet but ready
    let total_payable_ut = new Decimal(0)
    let absent_days = 0
    let present_days = 0
    let missing_records_count = 0

    const recordMap = new Map()
    if (attendance) {
      for (const rec of attendance) {
        recordMap.set(rec.work_date, rec)
        if (rec.status === 'Absent') {
          absent_days++
        } else if (['Present', 'Work From Home'].includes(rec.status)) {
          present_days++
        }
      }
    }

    const interval = eachDayOfInterval({ 
      start: parseISO(period.period_start), 
      end: parseISO(period.period_end) 
    })

    const timesheetDetailsInserts = []

    for (const d of interval) {
      const dateStr = format(d, 'yyyy-MM-dd')
      const dayName = format(d, 'EEEE')
      
      const isRestDay = restDays.includes(dayName)
      let dayType = 'Regular Workday'
      
      const holiday = holidayList.find((h: any) => h.date === dateStr)
      if (holiday) {
        if (holiday.type === 'Regular') dayType = isRestDay ? 'Regular Holiday + Rest Day' : 'Regular Holiday'
        else if (holiday.type === 'Special Non-Working') dayType = isRestDay ? 'Special Non-Working Day + Rest Day' : 'Special Non-Working Day'
      } else {
        dayType = isRestDay ? 'Scheduled Rest Day' : 'Regular Workday'
      }

      const hasRecord = recordMap.has(dateStr)
      const isExpectedWorkDay = !isRestDay

      if (isExpectedWorkDay && !hasRecord) {
        missing_records_count++
      }

      const rec = recordMap.get(dateStr)
      
      // Parse details from attendance record
      let regularHours = 0
      let recordedOt = 0
      let payableOt = 0
      let recordedUt = 0
      let payableUt = 0

      if (rec && ['Present', 'Work From Home', 'Holiday'].includes(rec.status)) {
         let actualHours = (rec.regular_hours != null && rec.regular_hours > 0) ? rec.regular_hours : scheduledHours
         
         if (actualHours > scheduledHours) {
           regularHours = scheduledHours
           recordedOt = (actualHours - scheduledHours) + (rec.overtime_hours || 0)
           recordedUt = 0
         } else if (actualHours < scheduledHours) {
           regularHours = actualHours
           recordedOt = rec.overtime_hours || 0
           recordedUt = scheduledHours - actualHours
         } else {
           regularHours = scheduledHours
           recordedOt = rec.overtime_hours || 0
           recordedUt = 0
         }
         
         payableOt = requiresApproval ? 0 : recordedOt // Auto-approve if policy says so
         payableUt = recordedUt
         
         total_regular_hours = total_regular_hours.plus(regularHours)
         total_recorded_ot = total_recorded_ot.plus(recordedOt)
         total_payable_ot = total_payable_ot.plus(payableOt)
         total_recorded_ut = total_recorded_ut.plus(recordedUt)
         total_payable_ut = total_payable_ut.plus(payableUt)
      }

      timesheetDetailsInserts.push({
        date: dateStr,
        day_type: dayType,
        scheduled_hours: scheduledHours,
        regular_hours: regularHours,
        recorded_ot_hours: recordedOt,
        approved_ot_hours: payableOt, // Initial state
        payable_ot_hours: payableOt,
        recorded_ut_hours: recordedUt,
        excused_ut_hours: 0,
        payable_ut_hours: payableUt
      })
    }

    // Upsert Timesheet
    const timesheetData = {
      employee_id: emp.id,
      payroll_period_id: payrollPeriodId,
      period_start: period.period_start,
      period_end: period.period_end,
      status: 'Draft',
      is_stale: false,
      missing_records_count: missing_records_count,
      generated_at: new Date().toISOString(),
      
      // New columns from migration 032
      total_regular_hours: total_regular_hours.toNumber(),
      total_recorded_ot_hours: total_recorded_ot.toNumber(),
      total_payable_ot_hours: total_payable_ot.toNumber(),
      total_recorded_ut_hours: total_recorded_ut.toNumber(),
      total_payable_ut_hours: total_payable_ut.toNumber(),
      calculated_total_regular_hours: total_regular_hours.toNumber(),
      calculated_absent_days: absent_days,
      calculated_present_days: present_days,
      
      absent_days: absent_days,
      updated_at: new Date().toISOString()
    }

    let tsId = existing?.id

    if (existing) {
      const { error: updateErr } = await supabase.from('timesheets').update(timesheetData).eq('id', tsId)
      if (updateErr) {
        console.error("Error updating timesheet:", updateErr)
        return { success: false, error: "Database error updating timesheet: " + updateErr.message }
      }
      // Delete existing details to replace them cleanly
      await supabase.from('timesheet_details').delete().eq('timesheet_id', tsId)
    } else {
      const { data: newTs, error: insertErr } = await supabase.from('timesheets').insert(timesheetData).select().single()
      if (insertErr) {
        console.error("Error inserting timesheet:", insertErr)
        return { success: false, error: "Database error inserting timesheet: " + insertErr.message }
      }
      tsId = newTs?.id
    }

    if (tsId && timesheetDetailsInserts.length > 0) {
      // Map timesheet_id to the inserts
      const detailsToInsert = timesheetDetailsInserts.map(d => ({ ...d, timesheet_id: tsId }))
      const { error: detailsErr } = await supabase.from('timesheet_details').insert(detailsToInsert)
      if (detailsErr) console.error("Error inserting timesheet details:", detailsErr)
    }

    generated++
  }

  revalidatePath('/attendance')
  return { success: true, message: `Generated ${generated} timesheets. Skipped ${skipped} approved.` }
}

export async function approveTimesheet(timesheetId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify timesheet can be approved
  const { data: ts } = await supabase.from('timesheets').select('*').eq('id', timesheetId).single()
  if (!ts) return { success: false, error: 'Timesheet not found.' }
  if (ts.is_stale) return { success: false, error: 'Timesheet is stale. Please regenerate.' }

  const { error } = await supabase.from('timesheets').update({ status: 'Approved' }).eq('id', timesheetId)
  if (error) return { success: false, error: error.message }

  // Log history
  await supabase.from('timesheet_status_history').insert({
    timesheet_id: timesheetId,
    old_status: ts.status,
    new_status: 'Approved',
    changed_by: user?.id,
    reason: 'Manual approval'
  })

  revalidatePath('/attendance')
  return { success: true }
}

export async function approveAllTimesheets(payrollPeriodId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: drafts } = await supabase
    .from('timesheets')
    .select('id, missing_records_count, is_stale, status')
    .eq('payroll_period_id', payrollPeriodId)
    .in('status', ['Draft', 'Reopened'])

  if (!drafts || drafts.length === 0) {
    return { success: false, error: 'No draft timesheets found to approve.' }
  }

  let approved = 0
  let failed = 0

  for (const ts of drafts) {
    if (ts.is_stale) {
      failed++
      continue
    }

    await supabase.from('timesheets').update({ status: 'Approved' }).eq('id', ts.id)
    await supabase.from('timesheet_status_history').insert({
      timesheet_id: ts.id,
      old_status: ts.status,
      new_status: 'Approved',
      changed_by: user?.id,
      reason: 'Bulk approval'
    })
    approved++
  }

  revalidatePath('/attendance')
  return { success: true, message: `Approved ${approved} timesheets. Skipped ${failed} with exceptions.` }
}

export async function updateTimesheetOverrides(timesheetId: string, overrides: any, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: ts } = await supabase.from('timesheets').select('status').eq('id', timesheetId).single()
  if (ts?.status === 'Approved') {
    return { success: false, error: 'Cannot edit an Approved timesheet.' }
  }

  const updateData = { ...overrides }
  const detailsUpdates = updateData.timesheet_details_updates
  delete updateData.timesheet_details_updates

  const tsUpdate = {
    ...updateData,
    override_reason: reason,
    override_by: user?.id,
    override_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase.from('timesheets').update(tsUpdate).eq('id', timesheetId)
  if (error) return { success: false, error: error.message }

  if (detailsUpdates && Array.isArray(detailsUpdates)) {
    for (const d of detailsUpdates) {
      await supabase.from('timesheet_details').update({
        payable_ot_hours: d.payable_ot_hours,
        payable_ut_hours: d.payable_ut_hours
      }).eq('id', d.id)
    }
  }

  revalidatePath('/attendance')
  return { success: true }
}

export async function reopenTimesheet(timesheetId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: ts } = await supabase.from('timesheets').select('*').eq('id', timesheetId).single()
  if (!ts) return { success: false, error: 'Timesheet not found.' }

  const { error } = await supabase.from('timesheets').update({ status: 'Reopened' }).eq('id', timesheetId)
  if (error) return { success: false, error: error.message }

  await supabase.from('timesheet_status_history').insert({
    timesheet_id: timesheetId,
    old_status: ts.status,
    new_status: 'Reopened',
    changed_by: user?.id,
    reason: 'Manual reopen to allow editing attendance'
  })

  revalidatePath('/attendance')
  return { success: true }
}
