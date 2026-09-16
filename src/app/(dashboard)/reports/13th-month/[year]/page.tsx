import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Download, ChevronLeft, ChevronRight } from "lucide-react"
import { SYSTEM_EARNING_DESCRIPTIONS } from "@/lib/payroll/constants"

export default async function ThirteenthMonthReportPage({ params }: { params: Promise<{ year: string }> }) {
  const { year: yearStr } = await params
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
    const { data: items, error: itemsError } = await supabase
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
          // Add month to set (YYYY-MM)
          const periodEnd = runToPeriodEndMap.get(item.payroll_run_id)
          if (periodEnd) {
            employeeAggregates[empId].monthsActive.add(periodEnd.substring(0, 7))
          }
        }
      })
    }
  }

  // Compute 13th month pay
  const TAX_CEILING = 90000

  const reportData = Object.values(employeeAggregates).map(agg => {
    const monthsCounted = agg.monthsActive.size
    const computed13th = agg.totalBasicPay / 12
    const exemptPortion = Math.min(computed13th, TAX_CEILING)
    const taxablePortion = Math.max(0, computed13th - TAX_CEILING)

    return {
      employee: agg.employee,
      monthsCounted,
      totalBasicPay: agg.totalBasicPay,
      computed13th,
      exemptPortion,
      taxablePortion
    }
  }).sort((a, b) => {
    const aName = (a.employee.last_name || '').toLowerCase()
    const bName = (b.employee.last_name || '').toLowerCase()
    return aName.localeCompare(bName)
  })

  const formatMoney = (amount: number) => {
    return Number(amount).toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 })
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">13th Month Pay Report</h1>
          <p className="text-slate-500 text-sm">Standalone computation based on finalized payroll runs for {year}.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm">
            <Link href={`/reports/13th-month/${year - 1}`} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-r border-slate-200">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <span className="px-6 py-2 font-semibold text-slate-700">{year}</span>
            <Link href={`/reports/13th-month/${year + 1}`} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-l border-slate-200">
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <a 
            href={`/api/reports/13th-month/export?year=${year}`}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-semibold w-16">#</th>
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold text-center w-32">Months Counted</th>
                <th className="px-6 py-4 font-semibold text-right">Total Basic Pay</th>
                <th className="px-6 py-4 font-semibold text-right">Computed 13th Month</th>
                <th className="px-6 py-4 font-semibold text-right text-emerald-700">Exempt (≤90k)</th>
                <th className="px-6 py-4 font-semibold text-right text-red-700">Taxable (&gt;90k)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.map((row, index) => (
                <tr key={row.employee.employee_code} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-500">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{row.employee.last_name}, {row.employee.first_name}</div>
                    <div className="text-xs text-slate-500">{row.employee.employee_code} • {row.employee.departments?.name || 'No Dept'}</div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-slate-700">{row.monthsCounted}</td>
                  <td className="px-6 py-4 text-right text-slate-700">{formatMoney(row.totalBasicPay)}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">{formatMoney(row.computed13th)}</td>
                  <td className="px-6 py-4 text-right font-medium text-emerald-700">{formatMoney(row.exemptPortion)}</td>
                  <td className="px-6 py-4 text-right font-medium text-red-700">{formatMoney(row.taxablePortion)}</td>
                </tr>
              ))}

              {reportData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No approved payroll data found for {year}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
