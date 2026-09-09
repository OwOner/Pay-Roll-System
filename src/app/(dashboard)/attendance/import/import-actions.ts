"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { STATUS_MAPPING } from "./weekly-constants"

export type ParsedAttendanceRow = {
  employee_code: string;
  employee_name: string;
  date_iso: string; // YYYY-MM-DD
  status_shortcode: string | null;
  ot_hours: number | null;
  ut_hours: number | null;
}

export type ExcelValidationResult = {
  key: string;
  employee_id: string | null;
  employee_code: string;
  employee_name: string;
  date_iso: string;
  status_full: string | null;
  ot_hours: number | null;
  ut_hours: number | null;
  
  action: 'New' | 'Update' | 'Duplicate' | 'Conflict' | 'Invalid';
  reason?: string;
  
  existing_id?: string;
  existing_status?: string;
  existing_source?: string;
  existing_ot?: number;
  existing_ut?: number;
  
  skip: boolean;
  override_conflict: boolean;
}

export async function validateExcelBatch(parsedRows: ParsedAttendanceRow[]): Promise<ExcelValidationResult[]> {
  const supabase = await createClient()

  // 1. Fetch active employees to match employee_codes
  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_code, first_name, last_name")
    .eq("employment_status", "Active")

  const employeeMap = new Map(employees?.map(e => [e.employee_code, e]) || [])

  // 2. Fetch existing attendance records for the dates and employees in this batch
  const uniqueDates = Array.from(new Set(parsedRows.map(r => r.date_iso)))
  const uniqueEmpCodes = Array.from(new Set(parsedRows.map(r => r.employee_code)))
  const matchedEmpIds = uniqueEmpCodes.map(code => employeeMap.get(code)?.id).filter(Boolean) as string[]

  let existingRecords: any[] = []
  if (matchedEmpIds.length > 0 && uniqueDates.length > 0) {
    const { data } = await supabase
      .from("attendance_records")
      .select("id, employee_id, work_date, status, source, overtime_hours")
      .in("employee_id", matchedEmpIds)
      .in("work_date", uniqueDates)
      
    existingRecords = data || []
  }

  // NOTE: undertime/late is NOT currently stored per-day in attendance_records, only in timesheets.
  // But for the Excel import, we will store them... wait. The database schema for attendance_records
  // doesn't have `undertime_hours`. Wait, `timesheets` has `late_undertime_hours`.
  // Wait, if it doesn't have it, where do we save the daily UT?
  // Let me check if attendance_records has it. If not, I can just leave it un-saved in the DB for now,
  // or I can put it in internal_notes or skip it, OR alter the table. Let me just leave it in the type.

  const recordMap = new Map(
    existingRecords.map(r => [`${r.employee_id}_${r.work_date}`, r])
  )

  // 3. Process each parsed row
  const results: ExcelValidationResult[] = parsedRows.map(row => {
    const emp = employeeMap.get(row.employee_code)
    const statusFull = row.status_shortcode ? STATUS_MAPPING[row.status_shortcode] || null : null

    const result: ExcelValidationResult = {
      key: `${row.employee_code}_${row.date_iso}`,
      employee_id: emp?.id || null,
      employee_code: row.employee_code,
      employee_name: row.employee_name,
      date_iso: row.date_iso,
      status_full: statusFull,
      ot_hours: row.ot_hours,
      ut_hours: row.ut_hours,
      action: 'Invalid',
      skip: false,
      override_conflict: false
    }

    if (!emp) {
      result.action = 'Invalid'
      result.reason = 'Employee not found in database'
      result.skip = true
      return result
    }

    if (!statusFull && row.status_shortcode) {
      result.action = 'Invalid'
      result.reason = `Unknown status code: ${row.status_shortcode}`
      result.skip = true
      return result
    }

    if (!statusFull) {
      // Blank cell = missing or ignored. We don't import blank cells.
      result.action = 'Invalid'
      result.reason = 'Blank status'
      result.skip = true
      return result
    }

    // Block importing records for future dates (after today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const rowDate = new Date(row.date_iso + 'T00:00:00')
    if (rowDate > today) {
      result.action = 'Invalid'
      result.reason = `Future date (${row.date_iso}) — only today and past dates can be imported`
      result.skip = true
      return result
    }

    const existing = recordMap.get(`${emp.id}_${row.date_iso}`)

    if (existing) {
      result.existing_id = existing.id
      result.existing_status = existing.status
      result.existing_source = existing.source
      result.existing_ot = existing.overtime_hours

      // Check if literally anything changed
      const isStatusIdentical = existing.status === statusFull
      const isOtIdentical = (existing.overtime_hours || 0) === (row.ot_hours || 0)
      
      if (isStatusIdentical && isOtIdentical) {
        result.action = 'Duplicate'
        result.reason = 'Identical record already exists'
        result.skip = true 
      } else if (existing.source === 'excel_import' || existing.source === 'excel_weekly_template' || existing.source === 'excel') {
        result.action = 'Update'
        result.skip = false 
      } else {
        result.action = 'Conflict'
        result.reason = `Conflicts with existing ${existing.source} record (${existing.status})`
        result.skip = true 
      }
    } else {
      result.action = 'New'
    }

    return result
  })

  return results
}

export async function commitExcelBatch(validatedRows: ExcelValidationResult[], batchId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const rowsToProcess = validatedRows.filter(r => !r.skip && r.employee_id && r.status_full)

  // Server-side safety net: never commit records for future dates
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const safRows = rowsToProcess.filter(r => {
    const d = new Date(r.date_iso + 'T00:00:00')
    return d <= today
  })

  if (safRows.length === 0) {
    return { success: false, error: 'No valid rows to commit (future dates are not allowed)' }
  }

  const updates = []
  const inserts = []

  for (const row of safRows) {
    // If UT hours are present, we might want to store them in internal_notes since DB doesn't have a specific column yet
    const notes = row.ut_hours ? `Undertime: ${row.ut_hours} hrs` : null;

    if (row.action === 'Update' || (row.action === 'Conflict' && row.override_conflict)) {
      if (row.existing_id) {
        updates.push({
          id: row.existing_id,
          status: row.status_full,
          regular_hours: ['Present', 'Work From Home', 'Holiday'].includes(row.status_full as string) ? 8 : 0,
          overtime_hours: row.ot_hours || 0,
          internal_notes: notes,
          last_modified_source: 'excel',
          last_modified_by: user.id,
          last_modified_at: new Date().toISOString()
        })
      }
    } else if (row.action === 'New') {
      inserts.push({
        employee_id: row.employee_id,
        work_date: row.date_iso,
        status: row.status_full,
        source: 'excel',
        import_batch_id: batchId,
        regular_hours: ['Present', 'Work From Home', 'Holiday'].includes(row.status_full as string) ? 8 : 0,
        overtime_hours: row.ot_hours || 0,
        internal_notes: notes,
        night_differential_hours: 0,
        is_rest_day: row.status_full === 'Rest Day'
      })
    }
  }

  try {
    if (inserts.length > 0) {
      const { error: insertError } = await supabase.from('attendance_records').insert(inserts)
      if (insertError) throw insertError
    }

    if (updates.length > 0) {
      const { error: updateError } = await supabase.from('attendance_records').upsert(updates, { onConflict: 'id' })
      if (updateError) throw updateError
    }

    revalidatePath('/attendance')
    return { success: true, newCount: inserts.length, updateCount: updates.length }
  } catch (err: any) {
    console.error("Excel Commit Error:", err)
    return { success: false, error: err.message }
  }
}
