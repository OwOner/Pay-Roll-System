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
    "Employee Name",
    "Employee ID",
    "Days Worked",
    "Basic Pay",
    "OT Pay",
    "ND Pay",
    "Holiday Pay",
    "Non-Taxable Earnings",
    "Gross Pay",
    "SSS",
    "PhilHealth",
    "Pag-IBIG",
    "Withholding Tax",
    "Cash Advance Deduction",
    "Total Deductions",
    "Net Pay"
  ]

  let csv = headers.join(',') + '\n'

  const totals = {
    daysWorked: 0,
    basicPay: 0,
    otPay: 0,
    ndPay: 0,
    holidayPay: 0,
    nonTaxable: 0,
    grossPay: 0,
    sss: 0,
    philhealth: 0,
    pagibig: 0,
    withholdingTax: 0,
    cashAdvance: 0,
    totalDeductions: 0,
    netPay: 0
  }

  const activeItems = (items || []).filter((item: any) => !item.is_excluded)

  for (const item of activeItems) {
    const emp = item.employees as any
    const fullName = `${emp?.first_name || ''} ${emp?.last_name || ''}`.trim()
    const earnings = item.payroll_earnings || []
    const deductions = item.payroll_deductions || []
    const timesheet = timesheets?.find(t => t.employee_id === emp.id)

    const daysWorked = timesheet ? Number(timesheet.calculated_present_days || 0) : 0

    let basicPay = 0
    let otPay = 0
    let ndPay = 0
    let holidayPay = 0
    let nonTaxable = 0

    for (const e of earnings) {
      if (!e.is_taxable) {
        nonTaxable += Number(e.amount)
        continue // Already counted as non-taxable, but if it is basic/ot it shouldn't overlap usually. Wait, MWE exempt is non-taxable.
      }
      
      const desc = (e.description || '').toLowerCase()
      if (desc.includes('basic') || desc.includes('regular pay')) basicPay += Number(e.amount)
      else if (desc.includes('overtime') || desc.includes('ot')) otPay += Number(e.amount)
      else if (desc.includes('night') || desc.includes('nd')) ndPay += Number(e.amount)
      else if (desc.includes('holiday') || desc.includes('rest day')) holidayPay += Number(e.amount)
    }

    // Add MWE exempt earnings back to the specific buckets if they are not taxable
    for (const e of earnings) {
      if (!e.is_taxable && e.tax_treatment === 'mwe_exempt') {
         const desc = (e.description || '').toLowerCase()
         if (desc.includes('basic') || desc.includes('regular pay')) basicPay += Number(e.amount)
         else if (desc.includes('overtime') || desc.includes('ot')) otPay += Number(e.amount)
         else if (desc.includes('night') || desc.includes('nd')) ndPay += Number(e.amount)
         else if (desc.includes('holiday') || desc.includes('rest day')) holidayPay += Number(e.amount)
      }
    }

    let sss = 0
    let philhealth = 0
    let pagibig = 0
    let cashAdvance = 0
    // withholdingTax might be stored as an item field or deduction
    let withholdingTax = deductions.find((d: any) => d.type === 'Tax')?.amount || 0
    withholdingTax = Number(withholdingTax)

    for (const d of deductions) {
      const type = (d.type || '').toLowerCase()
      const source = (d.source || '')
      
      if (type === 'sss' || d.description?.toLowerCase().includes('sss')) sss += Number(d.amount)
      else if (type === 'philhealth' || d.description?.toLowerCase().includes('philhealth')) philhealth += Number(d.amount)
      else if (type === 'pag-ibig' || d.description?.toLowerCase().includes('pag-ibig')) pagibig += Number(d.amount)
      else if (source === 'Cash Advance') cashAdvance += Number(d.amount)
    }

    const totalDeductions = Number(item.total_deductions)
    const grossPay = Number(item.gross_pay)
    const netPay = Number(item.net_pay)

    // Accumulate totals
    totals.daysWorked += daysWorked
    totals.basicPay += basicPay
    totals.otPay += otPay
    totals.ndPay += ndPay
    totals.holidayPay += holidayPay
    totals.nonTaxable += nonTaxable
    totals.grossPay += grossPay
    totals.sss += sss
    totals.philhealth += philhealth
    totals.pagibig += pagibig
    totals.withholdingTax += withholdingTax
    totals.cashAdvance += cashAdvance
    totals.totalDeductions += totalDeductions
    totals.netPay += netPay

    const row = [
      fullName,
      emp?.employee_code || '',
      daysWorked.toFixed(2),
      basicPay.toFixed(2),
      otPay.toFixed(2),
      ndPay.toFixed(2),
      holidayPay.toFixed(2),
      nonTaxable.toFixed(2),
      grossPay.toFixed(2),
      sss.toFixed(2),
      philhealth.toFixed(2),
      pagibig.toFixed(2),
      withholdingTax.toFixed(2),
      cashAdvance.toFixed(2),
      totalDeductions.toFixed(2),
      netPay.toFixed(2)
    ]

    csv += row.map(v => `"${v}"`).join(',') + '\n'
  }

  // Summary Row
  const summaryRow = [
    "TOTAL",
    "",
    totals.daysWorked.toFixed(2),
    totals.basicPay.toFixed(2),
    totals.otPay.toFixed(2),
    totals.ndPay.toFixed(2),
    totals.holidayPay.toFixed(2),
    totals.nonTaxable.toFixed(2),
    totals.grossPay.toFixed(2),
    totals.sss.toFixed(2),
    totals.philhealth.toFixed(2),
    totals.pagibig.toFixed(2),
    totals.withholdingTax.toFixed(2),
    totals.cashAdvance.toFixed(2),
    totals.totalDeductions.toFixed(2),
    totals.netPay.toFixed(2)
  ]
  csv += summaryRow.map(v => `"${v}"`).join(',') + '\n'

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="payroll_register_${periodStart}_to_${periodEnd}.csv"`
    }
  })
}
