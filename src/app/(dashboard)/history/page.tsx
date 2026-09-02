import { createClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { FileText, Download, Printer } from "lucide-react"
import Link from "next/link"

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('roles(name)')
    .eq('id', user.id)
    .single()
    
  const roleName = (profile?.roles as any)?.name
  const isAdmin = roleName === 'Super Admin' || roleName === 'Payroll Manager'

  // Fetch Payroll History
  let query = supabase
    .from('payroll_items')
    .select(`
      id,
      gross_pay,
      net_pay,
      payroll_runs!inner (
        status,
        payroll_periods ( period_start, period_end, pay_date, pay_frequency )
      ),
      employees ( first_name, last_name, id )
    `)
    .in('payroll_runs.status', ['Approved', 'Paid'])
    .order('created_at', { ascending: false })

  // If not admin, restrict to own employee record
  if (!isAdmin) {
    const { data: emp } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .single()
      
    if (emp) {
      query = query.eq('employee_id', emp.id)
    }
  }

  const { data: history } = await query

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Payroll History</h2>
          <p className="text-slate-500">View finalized payslips and historical records.</p>
        </div>
      </div>

      <Card className="bg-white rounded-xl border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">Payslip Archive</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 font-medium">Period</th>
                <th className="px-6 py-3 font-medium">Pay Date</th>
                {isAdmin && <th className="px-6 py-3 font-medium">Employee</th>}
                <th className="px-6 py-3 font-medium text-right">Net Pay</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {(!history || history.length === 0) && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-slate-500">
                    No historical payslips found.
                  </td>
                </tr>
              )}
              {history?.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {new Date(item.payroll_runs.payroll_periods.period_start).toLocaleDateString()} - {new Date(item.payroll_runs.payroll_periods.period_end).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(item.payroll_runs.payroll_periods.pay_date).toLocaleDateString()}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-slate-900 font-medium">
                      {item.employees.first_name} {item.employees.last_name}
                    </td>
                  )}
                  <td className="px-6 py-4 text-right font-bold text-emerald-600">
                    ₱{item.net_pay.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      {item.payroll_runs.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/history/${item.id}/payslip`}
                      className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium transition-colors"
                    >
                      <FileText className="w-4 h-4" /> View Payslip
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
