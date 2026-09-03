import { Card } from "@/components/ui/card"
import { createClient, authorizeModule } from "@/lib/supabase/server"
import Link from "next/link"
import { PlayCircle, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default async function PayrollDashboardPage() {
  await authorizeModule('payroll')
  const supabase = await createClient()

  // Fetch all payroll runs
  const { data: runs, error } = await supabase
    .from('payroll_runs')
    .select(`
      id,
      status,
      created_at,
      version,
      payroll_periods (
        period_start,
        period_end,
        pay_frequency
      )
    `)
    .order('created_at', { ascending: false })

  // Summaries
  const draftCount = runs?.filter(r => r.status === 'Draft' || r.status === 'Calculated' || r.status === 'Rejected').length || 0
  const pendingCount = runs?.filter(r => r.status === 'For Review' || r.status === 'Pending Approval').length || 0
  const completedCount = runs?.filter(r => r.status === 'Approved' || r.status === 'Paid').length || 0

  function getStatusBadge(status: string) {
    switch (status) {
      case 'Draft':
      case 'Calculated':
      case 'For Review':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{status}</span>
      case 'Pending Approval':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Pending Approval</span>
      case 'Approved':
      case 'Paid':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> {status}</span>
      case 'Rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="w-3 h-3"/> Rejected</span>
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{status}</span>
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Payroll Management</h2>
          <p className="text-slate-500">Run and manage payroll cycles for your company.</p>
        </div>
        <Link 
          href="/payroll/run" 
          className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors shadow-sm"
        >
          <PlayCircle className="w-4 h-4" />
          Run New Payroll
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white rounded-xl border-slate-200 shadow-sm p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Clock className="w-4 h-4" /> Drafts & Review
          </div>
          <div className="text-3xl font-bold text-slate-900">{draftCount}</div>
        </Card>
        <Card className="bg-white rounded-xl border-slate-200 shadow-sm p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-orange-600 font-medium">
            <AlertCircle className="w-4 h-4" /> Pending Approval
          </div>
          <div className="text-3xl font-bold text-slate-900">{pendingCount}</div>
        </Card>
        <Card className="bg-white rounded-xl border-slate-200 shadow-sm p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <CheckCircle className="w-4 h-4" /> Completed
          </div>
          <div className="text-3xl font-bold text-slate-900">{completedCount}</div>
        </Card>
      </div>

      <Card className="bg-white rounded-xl border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">All Payroll Runs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 font-medium">Period</th>
                <th className="px-6 py-3 font-medium">Frequency</th>
                <th className="px-6 py-3 font-medium">Created At</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!runs || runs.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No payroll runs found. Click "Run New Payroll" to get started.
                  </td>
                </tr>
              )}
              {runs?.map((run: any) => (
                <tr key={run.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {new Date(run.payroll_periods.period_start).toLocaleDateString()} - {new Date(run.payroll_periods.period_end).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {run.payroll_periods.pay_frequency}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(run.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(run.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/payroll/${run.id}`}
                      className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
                    >
                      View Details
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
