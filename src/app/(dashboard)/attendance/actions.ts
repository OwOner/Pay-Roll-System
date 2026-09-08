"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type AttendanceSummary = {
  totalEmployees: number
  present: number
  absent: number
  leave: number
  totalOtHours: number
  missingRecords: number
}

export async function fetchCurrentPayrollPeriod() {
  const supabase = await createClient()
  
  // Try to find an active/draft payroll period
  const { data: period } = await supabase
    .from('payroll_periods')
    .select('start_date, end_date')
    .in('status', ['Draft', 'Open'])
    .order('start_date', { ascending: false })
    .limit(1)
    .single()

  if (period) {
    return { startDate: period.start_date, endDate: period.end_date }
  }

  // Fallback to current month (1st to today, or end of month)
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  
  return { 
    startDate: firstDay.toISOString().split('T')[0], 
    endDate: lastDay.toISOString().split('T')[0] 
  }
}

export async function fetchAttendanceMatrix(startDate: string, endDate: string) {
  const supabase = await createClient()

  // Fetch all active employees
  const { data: employees } = await supabase
    .from('employees')
    .select('id, first_name, last_name, employee_code')
    .eq('employment_status', 'Active')
    .order('last_name', { ascending: true })

  // Fetch attendance records in range
  const { data: records } = await supabase
    .from('attendance_records')
    .select(`
      *,
      projects(project_name)
    `)
    .gte('work_date', startDate)
    .lte('work_date', endDate)

  return { employees: employees || [], records: records || [] }
}

export async function updateAttendanceRecord(
  recordId: string | null,
  payload: any,
  reason: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    if (recordId) {
      // 1. Fetch original record
      const { data: originalRecord } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('id', recordId)
        .single()

      if (!originalRecord) return { success: false, error: 'Record not found' }

      const sourceBefore = originalRecord.source
      
      // We do not change the 'source' column. We update last_modified_source.
      const updateData = {
        time_in: payload.time_in,
        time_out: payload.time_out,
        status: payload.status,
        regular_hours: payload.regular_hours || 0,
        overtime_hours: payload.overtime_hours || 0,
        project_id: payload.project_id || null,
        internal_notes: payload.internal_notes || null,
        last_modified_source: 'manual_correction',
        last_modified_by: user.id,
        last_modified_at: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('attendance_records')
        .update(updateData)
        .eq('id', recordId)

      if (updateError) throw updateError

      // 2. Insert Revision
      const { error: revError } = await supabase
        .from('attendance_revisions')
        .insert({
          attendance_record_id: recordId,
          changed_by_user_id: user.id,
          change_type: 'manual_correction',
          source_before: sourceBefore,
          source_after: 'manual_correction',
          original_payload: originalRecord,
          corrected_payload: updateData,
          reason: reason
        })

      if (revError) throw revError

    } else {
      // Create new record manually
      const insertData = {
        employee_id: payload.employee_id,
        work_date: payload.work_date,
        time_in: payload.time_in,
        time_out: payload.time_out,
        status: payload.status,
        regular_hours: payload.regular_hours || 0,
        overtime_hours: payload.overtime_hours || 0,
        project_id: payload.project_id || null,
        internal_notes: payload.internal_notes || null,
        source: 'manual_entry'
      }

      const { data: newRecord, error: insertError } = await supabase
        .from('attendance_records')
        .insert(insertData)
        .select()
        .single()

      if (insertError) throw insertError
      
      // Revision for new manual entry isn't strictly required, 
      // but we can add one or just rely on the 'source' = manual_entry.
    }

    revalidatePath('/attendance')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
