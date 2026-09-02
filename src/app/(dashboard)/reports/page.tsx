import { createClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { FileDown, CalendarDays, Filter } from "lucide-react"

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period } = await searchParams
  const supabase = await createClient()

  // Ensure Admin Access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('roles(name)').eq('id', user.id).single()
  const roleName = (profile?.roles as any)?.name
  if (roleName !== 'Super Admin' && roleName !== 'Payroll Manager') {
    return (
      <div className="p-8 text-center text-slate-500">
        You do not have permission to view reports.
      </div>
    )
  }

  // 1. Fetch available completed periods for filter
  const { data: completedRuns } = await supabase
    .from('payroll_runs')
    .select(`
      id,
      payroll_periods ( id, period_start, period_end, pay_date )
    `)
    .in('status', ['Approved', 'Paid'])
    .order('created_at', { ascending: false })

  // 2. Fetch payroll items for aggregation based on filter
  let query = supabase
    .from('payroll_items')
    .select(`
      gross_pay,
      net_pay,
      withholding_tax,
      total_deductions,
      sss_employee,
      sss_employer,
      sss_ec,
      philhealth_employee,
      philhealth_employer,
      pagibig_employee,
      pagibig_employer,
      payroll_runs!inner(id, payroll_period_id)
    `)
    .in('payroll_runs.status', ['Approved', 'Paid'])

  if (period) {
    query = query.eq('payroll_runs.payroll_period_id', period)
  }

  const { data: items } = await query

  // Calculate Aggregations
  let totalGross = 0
  let totalNet = 0
  let totalEmployeeTax = 0
  
  let totalSSSEmployee = 0
  let totalSSSEmployer = 0
  let totalPHEmployee = 0
  let totalPHEmployer = 0
  let totalPagibigEmployee = 0
  let totalPagibigEmployer = 0

  items?.forEach(i => {
    totalGross += Number(i.gross_pay || 0)
    totalNet += Number(i.net_pay || 0)
    totalEmployeeTax += Number(i.withholding_tax || 0)
    
    totalSSSEmployee += Number(i.sss_employee || 0)
    totalSSSEmployer += Number(i.sss_employer || 0) + Number(i.sss_ec || 0)
    
    totalPHEmployee += Number(i.philhealth_employee || 0)
    totalPHEmployer += Number(i.philhealth_employer || 0)
    
    totalPagibigEmployee += Number(i.pagibig_employee || 0)
    totalPagibigEmployer += Number(i.pagibig_employer || 0)
  })

  const totalEmployeeDeductions = totalSSSEmployee + totalPHEmployee + totalPagibigEmployee + totalEmployeeTax
  const totalEmployerContributions = totalSSSEmployer + totalPHEmployer + totalPagibigEmployer
  const totalEmployerCost = totalGross + totalEmployerContributions

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Reports</h2>
          <p className="text-slate-500">Payroll summaries and government remittance reports.</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 bg-white text-slate-900 border border-slate-200 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <FileDown className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white rounded-xl border-slate-200 shadow-sm p-4 flex gap-4 items-center">
        <Filter className="w-5 h-5 text-slate-400" />
        <form className="flex gap-4 items-center w-full">
          <select 
            name="period" 
            defaultValue={period || ""} 
            className="p-2 text-sm border border-slate-200 rounded-lg bg-slate-50 flex-1 max-w-xs"
          >
            <option value="">All Time</option>
            {completedRuns?.map((run: any) => (
              <option key={run.payroll_periods.id} value={run.payroll_periods.id}>
                {new Date(run.payroll_periods.period_start).toLocaleDateString()} - {new Date(run.payroll_periods.period_end).toLocaleDateString()}
              </option>
            ))}
          </select>
          <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
            Apply
          </button>
        </form>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white rounded-xl border-slate-200 shadow-sm p-6 flex flex-col gap-1">
          <div className="text-slate-500 font-medium text-sm">Gross Payroll</div>
          <div className="text-2xl font-bold text-slate-900">₱{totalGross.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        </Card>
        <Card className="bg-white rounded-xl border-slate-200 shadow-sm p-6 flex flex-col gap-1">
          <div className="text-slate-500 font-medium text-sm">Net Payroll</div>
          <div className="text-2xl font-bold text-emerald-600">₱{totalNet.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        </Card>
        <Card className="bg-white rounded-xl border-slate-200 shadow-sm p-6 flex flex-col gap-1">
          <div className="text-slate-500 font-medium text-sm">Employer Contributions</div>
          <div className="text-2xl font-bold text-orange-600">₱{totalEmployerContributions.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        </Card>
        <Card className="bg-slate-900 rounded-xl border-slate-800 shadow-sm p-6 flex flex-col gap-1 text-white">
          <div className="text-slate-400 font-medium text-sm">Total Employer Cost</div>
          <div className="text-2xl font-bold">₱{totalEmployerCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        </Card>
      </div>

      {/* Remittance Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white rounded-xl border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Employee Deductions</h3>
            <p className="text-sm text-slate-500">Amounts withheld from employee gross pay.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-600 font-medium">Withholding Tax (BIR)</span>
              <span className="font-bold text-slate-900">₱{totalEmployeeTax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-600 font-medium">SSS (Employee Share)</span>
              <span className="font-bold text-slate-900">₱{totalSSSEmployee.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-600 font-medium">PhilHealth (Employee Share)</span>
              <span className="font-bold text-slate-900">₱{totalPHEmployee.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className="text-slate-600 font-medium">Pag-IBIG (Employee Share)</span>
              <span className="font-bold text-slate-900">₱{totalPagibigEmployee.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </div>
        </Card>

        <Card className="bg-white rounded-xl border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Employer Contributions</h3>
            <p className="text-sm text-slate-500">Additional costs shouldered by the company.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-600 font-medium">SSS (Employer Share + EC)</span>
              <span className="font-bold text-slate-900">₱{totalSSSEmployer.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-600 font-medium">PhilHealth (Employer Share)</span>
              <span className="font-bold text-slate-900">₱{totalPHEmployer.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className="text-slate-600 font-medium">Pag-IBIG (Employer Share)</span>
              <span className="font-bold text-slate-900">₱{totalPagibigEmployer.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
