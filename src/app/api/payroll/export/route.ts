import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const runId = searchParams.get('runId')

  if (!runId) {
    return new NextResponse('Missing runId parameter', { status: 400 })
  }

  const supabase = await createClient()

  const { data: run, error: runError } = await supabase
    .from('payroll_runs')
    .select('*, payroll_periods(id, period_start, period_end)')
    .eq('id', runId)
    .single()

  if (runError || !run) {
    return new NextResponse('Payroll run not found', { status: 404 })
  }

  const { data: items, error: itemsError } = await supabase
    .from('payroll_items')
    .select(`
      *,
      employees(id, first_name, last_name, employee_code, departments(name), positions(title)),
      payroll_earnings(*),
      payroll_deductions(*)
    `)
    .eq('payroll_run_id', runId)

  if (itemsError) {
    return new NextResponse('Error fetching payroll items', { status: 500 })
  }

  // Fetch timesheets for the hours
  const { data: timesheets } = await supabase
    .from('timesheets')
    .select('*')
    .eq('payroll_period_id', run.payroll_period_id)

  const periodStart = run.payroll_periods.period_start
  const periodEnd = run.payroll_periods.period_end
  const payPeriod = `${periodStart} to ${periodEnd}`

  // Required Columns
  const headers = [
    "Employee",
    "Employee ID",
    "Department",
    "Position",
    "Pay Period",
    "Basic Pay",
    "Regular Hours",
    "OT Hours",
    "OT Pay",
    "Undertime Hours",
    "Night Differential",
    "Holiday/Rest-Day Pay",
    "Gross Pay",
    "SSS",
    "PhilHealth",
    "Pag-IBIG",
    "Withholding Tax",
    "Cash Advance Deduction",
    "Other Deductions",
    "Net Pay",
    "Payment Status"
  ]

  let csv = headers.join(',') + '\n'

  for (const item of items || []) {
    const emp = item.employees as any
    const fullName = `${emp?.first_name || ''} ${emp?.last_name || ''}`.trim()
    const earnings = item.payroll_earnings || []
    const deductions = item.payroll_deductions || []
    const timesheet = timesheets?.find(t => t.employee_id === emp.id)

    let basicPay = 0
    let otPay = 0
    let ndPay = 0
    let holidayPay = 0

    for (const e of earnings) {
      const desc = (e.description || '').toLowerCase()
      if (desc.includes('basic') || desc.includes('regular pay')) basicPay += Number(e.amount)
      else if (desc.includes('overtime') || desc.includes('ot')) otPay += Number(e.amount)
      else if (desc.includes('night') || desc.includes('nd')) ndPay += Number(e.amount)
      else if (desc.includes('holiday') || desc.includes('rest day')) holidayPay += Number(e.amount)
    }

    let sss = 0
    let philhealth = 0
    let pagibig = 0
    let cashAdvance = 0
    let otherDeds = 0
    let withholdingTax = Number(item.withholding_tax)

    for (const d of deductions) {
      const desc = (d.description || '').toLowerCase()
      const type = (d.type || '').toLowerCase()
      const source = (d.source || '')
      
      if (desc === 'sss' || type === 'sss') sss += Number(d.amount)
      else if (desc === 'philhealth' || type === 'philhealth') philhealth += Number(d.amount)
      else if (desc === 'pag-ibig' || desc === 'pagibig' || type === 'pag-ibig') pagibig += Number(d.amount)
      else if (source === 'Cash Advance') cashAdvance += Number(d.amount)
      else if (desc === 'withholding tax' || type === 'withholding tax') { /* Already covered by item.withholding_tax but just in case */ }
      else otherDeds += Number(d.amount)
    }

    const row = [
      fullName,
      emp?.employee_code || '',
      emp?.departments?.name || '',
      emp?.positions?.title || '',
      payPeriod,
      basicPay.toFixed(2),
      timesheet ? Number(timesheet.total_regular_hours || 0).toFixed(2) : '0.00',
      timesheet ? Number(timesheet.total_payable_ot_hours || 0).toFixed(2) : '0.00',
      otPay.toFixed(2),
      timesheet ? Number(timesheet.total_payable_ut_hours || 0).toFixed(2) : '0.00',
      ndPay.toFixed(2),
      holidayPay.toFixed(2),
      Number(item.gross_pay).toFixed(2),
      sss.toFixed(2),
      philhealth.toFixed(2),
      pagibig.toFixed(2),
      withholdingTax.toFixed(2),
      cashAdvance.toFixed(2),
      otherDeds.toFixed(2),
      Number(item.net_pay).toFixed(2),
      run.status
    ]

    csv += row.map(v => `"${v}"`).join(',') + '\n'
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="payroll_register_${periodStart}_to_${periodEnd}.csv"`
    }
  })
}
