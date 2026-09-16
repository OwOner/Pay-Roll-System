import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { SYSTEM_EARNING_DESCRIPTIONS } from "@/lib/payroll/constants"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const yearStr = searchParams.get('year')
  
  if (!yearStr) {
    return NextResponse.json({ error: 'Year is required' }, { status: 400 })
  }

  const year = parseInt(yearStr, 10)
  const supabase = await createClient()

  // Find all approved/paid runs for the given year
  const { data: runs, error: runsError } = await supabase
    .from('payroll_runs')
    .select(`
      id,
      status,
      payroll_periods!inner ( period_start, period_end, pay_date )
    `)
    .in('status', ['Approved', 'Paid'])
    .gte('payroll_periods.period_end', `${year}-01-01`)
    .lte('payroll_periods.period_end', `${year}-12-31`)

  const runIds = runs?.map(r => r.id) || []
  
  // Create a map of runId -> period_end string for month deduction
  const runToPeriodEndMap = new Map<string, string>()
  runs?.forEach(r => {
    runToPeriodEndMap.set(r.id, (r.payroll_periods as any).period_end)
  })

  let employeeAggregates: Record<string, any> = {}

  if (runIds.length > 0) {
    const { data: items } = await supabase
      .from('payroll_items')
      .select(`
        id,
        employee_id,
        payroll_run_id,
        employees ( first_name, last_name, employee_code, departments(name) ),
        payroll_earnings ( amount, description )
      `)
      .in('payroll_run_id', runIds)
      .eq('is_excluded', false)

    if (items) {
      items.forEach(item => {
        const empId = item.employee_id
        if (!employeeAggregates[empId]) {
          employeeAggregates[empId] = {
            employee: item.employees,
            totalBasicPay: 0,
            monthsActive: new Set<string>()
          }
        }

        // Filter basic pay
        const earnings = item.payroll_earnings as any[] || []
        const basicPayEarnings = earnings.filter(e => e.description === SYSTEM_EARNING_DESCRIPTIONS.BASIC_SALARY)
        const itemBasicPay = basicPayEarnings.reduce((sum, e) => sum + Number(e.amount), 0)

        if (itemBasicPay > 0) {
          employeeAggregates[empId].totalBasicPay += itemBasicPay
          const periodEnd = runToPeriodEndMap.get(item.payroll_run_id)
          if (periodEnd) {
            employeeAggregates[empId].monthsActive.add(periodEnd.substring(0, 7))
          }
        }
      })
    }
  }

  const TAX_CEILING = 90000
  let totalComputed = 0
  let totalExempt = 0
  let totalTaxable = 0

  const reportData = Object.values(employeeAggregates).map(agg => {
    const monthsCounted = agg.monthsActive.size
    const computed13th = agg.totalBasicPay / 12
    const exemptPortion = Math.min(computed13th, TAX_CEILING)
    const taxablePortion = Math.max(0, computed13th - TAX_CEILING)

    totalComputed += computed13th
    totalExempt += exemptPortion
    totalTaxable += taxablePortion

    return {
      employeeCode: agg.employee.employee_code,
      lastName: agg.employee.last_name,
      firstName: agg.employee.first_name,
      department: agg.employee.departments?.name || 'No Dept',
      monthsCounted,
      totalBasicPay: agg.totalBasicPay.toFixed(2),
      computed13th: computed13th.toFixed(2),
      exemptPortion: exemptPortion.toFixed(2),
      taxablePortion: taxablePortion.toFixed(2)
    }
  }).sort((a, b) => a.lastName.localeCompare(b.lastName))

  // Build CSV
  const header = ['Employee ID', 'Last Name', 'First Name', 'Department', 'Months Counted', 'Total Basic Pay', '13th Month Pay', 'Exempt Portion (<=90k)', 'Taxable Portion (>90k)']
  
  const rows = reportData.map(r => [
    r.employeeCode,
    `"${r.lastName}"`,
    `"${r.firstName}"`,
    `"${r.department}"`,
    r.monthsCounted,
    r.totalBasicPay,
    r.computed13th,
    r.exemptPortion,
    r.taxablePortion
  ])

  // Add Totals row
  rows.push([
    '',
    '',
    '',
    '"TOTALS"',
    '',
    '',
    totalComputed.toFixed(2),
    totalExempt.toFixed(2),
    totalTaxable.toFixed(2)
  ])

  const csvContent = [
    header.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n')

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="13th_month_pay_report_${year}.csv"`
    }
  })
}
