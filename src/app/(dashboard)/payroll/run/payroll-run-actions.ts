"use server"

import { createClient } from "@/lib/supabase/server"

export type PeriodStatus = {
  id?: string;
  start: string; // YYYY-MM-DD
  end: string;
  payDate: string;
  timesheetsGenerated: boolean;
  timesheetsApproved: boolean;
  hasPayrollRun: boolean;
  statusText: string;
}

// Helpers to generate periods
function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function getWeeklyPeriods(count: number): any[] {
  const periods = []
  const today = new Date()
  let currentMonday = new Date(today)
  const day = currentMonday.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day
  currentMonday.setDate(today.getDate() + diff - 7) // previous Monday

  for (let i = 0; i < count; i++) {
    const start = new Date(currentMonday)
    const end = addDays(start, 6)
    const payDate = addDays(start, 8) // Wednesday next week
    periods.push({ start, end, payDate })
    currentMonday = addDays(currentMonday, -7)
  }
  return periods
}

function getSemiMonthlyPeriods(count: number): any[] {
  const periods = []
  let current = new Date()
  // Move to previous half month
  if (current.getDate() > 15) {
    current = new Date(current.getFullYear(), current.getMonth(), 1)
  } else {
    current = new Date(current.getFullYear(), current.getMonth() - 1, 16)
  }

  for (let i = 0; i < count; i++) {
    const start = new Date(current)
    let end, payDate
    if (start.getDate() === 1) {
      end = new Date(start.getFullYear(), start.getMonth(), 15)
      payDate = new Date(start.getFullYear(), start.getMonth(), 20)
    } else {
      end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
      payDate = new Date(start.getFullYear(), start.getMonth() + 1, 5)
    }
    periods.push({ start, end, payDate })

    if (start.getDate() === 1) {
      current = new Date(start.getFullYear(), start.getMonth() - 1, 16)
    } else {
      current = new Date(start.getFullYear(), start.getMonth(), 1)
    }
  }
  return periods
}

function getMonthlyPeriods(count: number): any[] {
  const periods = []
  let current = new Date()
  current = new Date(current.getFullYear(), current.getMonth() - 1, 1)

  for (let i = 0; i < count; i++) {
    const start = new Date(current)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
    const payDate = new Date(start.getFullYear(), start.getMonth() + 1, 5)
    periods.push({ start, end, payDate })
    current = new Date(current.getFullYear(), current.getMonth() - 1, 1)
  }
  return periods
}

function getDailyPeriods(count: number): any[] {
  const periods = []
  let current = new Date()
  current.setDate(current.getDate() - 1)

  for (let i = 0; i < count; i++) {
    const start = new Date(current)
    const end = new Date(current)
    const payDate = addDays(current, 1)
    periods.push({ start, end, payDate })
    current.setDate(current.getDate() - 1)
  }
  return periods
}

function fmt(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function getPayrollPeriodStatuses(frequency: string): Promise<PeriodStatus[]> {
  const supabase = await createClient()

  let generatedPeriods: any[] = []
  if (frequency === "Weekly") generatedPeriods = getWeeklyPeriods(4)
  if (frequency === "Semi-Monthly") generatedPeriods = getSemiMonthlyPeriods(4)
  if (frequency === "Monthly") generatedPeriods = getMonthlyPeriods(3)
  if (frequency === "Daily") generatedPeriods = getDailyPeriods(7)

  // Format generated periods to strings
  const calendarPeriods = generatedPeriods.map(p => ({
    start: fmt(p.start),
    end: fmt(p.end),
    payDate: fmt(p.payDate)
  }))

  // Fetch all existing payroll periods for this frequency from DB
  const { data: dbPeriods } = await supabase
    .from('payroll_periods')
    .select('id, period_start, period_end, pay_date')
    .eq('pay_frequency', frequency)

  // Fetch timesheets and payroll runs
  const periodIds = (dbPeriods || []).map(p => p.id)
  
  let timesheetCounts: Record<string, { total: number, approved: number }> = {}
  let payrollRuns: Record<string, boolean> = {}

  if (periodIds.length > 0) {
    const { data: timesheets } = await supabase
      .from('timesheets')
      .select('payroll_period_id, status')
      .in('payroll_period_id', periodIds)
      
    if (timesheets) {
      timesheets.forEach(ts => {
        const id = ts.payroll_period_id
        if (!timesheetCounts[id]) timesheetCounts[id] = { total: 0, approved: 0 }
        timesheetCounts[id].total++
        if (ts.status === 'Approved') timesheetCounts[id].approved++
      })
    }

    const { data: runs } = await supabase
      .from('payroll_runs')
      .select('payroll_period_id')
      .in('payroll_period_id', periodIds)
      
    if (runs) {
      runs.forEach(run => {
        payrollRuns[run.payroll_period_id] = true
      })
    }
  }

  // Combine DB periods with Calendar periods
  const mergedPeriods = new Map<string, PeriodStatus>()

  // Add DB periods first
  if (dbPeriods) {
    dbPeriods.forEach(dbp => {
      const ts = timesheetCounts[dbp.id] || { total: 0, approved: 0 }
      const hasRun = !!payrollRuns[dbp.id]
      
      let statusText = "Timesheets not generated"
      if (hasRun) statusText = "Payroll run exists"
      else if (ts.total > 0 && ts.approved === ts.total) statusText = "All timesheets approved. Ready."
      else if (ts.total > 0) statusText = `${ts.approved}/${ts.total} timesheets approved.`
      
      mergedPeriods.set(`${dbp.period_start}_${dbp.period_end}`, {
        id: dbp.id,
        start: dbp.period_start,
        end: dbp.period_end,
        payDate: dbp.pay_date,
        timesheetsGenerated: ts.total > 0,
        timesheetsApproved: ts.total > 0 && ts.approved === ts.total,
        hasPayrollRun: hasRun,
        statusText
      })
    })
  }

  // Add Calendar periods if they don't exist in DB
  calendarPeriods.forEach(cp => {
    const key = `${cp.start}_${cp.end}`
    if (!mergedPeriods.has(key)) {
      mergedPeriods.set(key, {
        start: cp.start,
        end: cp.end,
        payDate: cp.payDate,
        timesheetsGenerated: false,
        timesheetsApproved: false,
        hasPayrollRun: false,
        statusText: "⚠ Timesheets not generated"
      })
    }
  })

  // Sort descending by start date
  return Array.from(mergedPeriods.values()).sort((a, b) => b.start.localeCompare(a.start))
}
