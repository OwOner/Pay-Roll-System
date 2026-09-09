"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function fetchImportContext() {
  const supabase = await createClient()

  const [employeesRes, projectsRes] = await Promise.all([
    supabase
      .from("employees")
      .select("id, first_name, last_name, employee_code, employment_status")
      .eq("employment_status", "Active"),
    supabase
      .from("projects")
      .select("id, project_name")
      .eq("is_active", true)
  ])

  return {
    employees: employeesRes.data || [],
    projects: projectsRes.data || [],
    error: employeesRes.error?.message || projectsRes.error?.message
  }
}

export type ValidatedAttendanceRow = {
  employee_id: string;
  project_id: string | null;
  work_date: string; // YYYY-MM-DD
  time_in: string | null; // ISO DateTime
  time_out: string | null; // ISO DateTime
  status: string; // Present, Absent, etc.
  internal_notes?: string;
}

export async function importAttendanceBatch(rows: ValidatedAttendanceRow[], batchId: string) {
  const supabase = await createClient()

  // Server-side future-date guard (Asia/Manila)
  const todayManila = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })
  )
  todayManila.setHours(0, 0, 0, 0)

  const futureRows = rows.filter(r => {
    const d = new Date(r.work_date + 'T00:00:00')
    return d > todayManila
  })

  if (futureRows.length > 0) {
    const futureDates = [...new Set(futureRows.map(r => r.work_date))].join(', ')
    return {
      success: false,
      error: `Import rejected: ${futureRows.length} record(s) have future dates (${futureDates}). Only today and past dates can be imported.`
    }
  }

  const safeRows = rows.filter(r => {
    const d = new Date(r.work_date + 'T00:00:00')
    return d <= todayManila
  })

  // Format payload — use safeRows (future dates already blocked above)
  const payload = safeRows.map(row => ({
    employee_id: row.employee_id,
    project_id: row.project_id || null,
    work_date: row.work_date,
    time_in: row.time_in,
    time_out: row.time_out,
    status: row.status,
    internal_notes: row.internal_notes || null,
    source: 'excel_import',
    import_batch_id: batchId,
    // Provide sensible defaults for required fields in case engine expects them
    regular_hours: 0,
    overtime_hours: 0,
    night_differential_hours: 0,
    is_rest_day: false
  }))

  const { error } = await supabase
    .from("attendance_records")
    .upsert(payload, { 
      onConflict: 'employee_id, work_date',
      ignoreDuplicates: false // This will overwrite existing manual entries with the import
    })

  if (error) {
    console.error("Import Error:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/attendance")
  return { success: true }
}
