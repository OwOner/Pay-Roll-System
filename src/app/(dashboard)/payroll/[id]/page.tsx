import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Clock, XCircle, FileText, ChevronRight, Eye } from "lucide-react"
import Link from "next/link"
import PayrollActions from "./actions-client"
import { EarningOverridePanel } from "./earning-override-panel"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DiagnosticsTab from "./diagnostics-tab"

export default async function PayrollRunDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch Payroll Run Details
  const [{ data: run, error }, { data: history }] = await Promise.all([
    supabase
      .from('payroll_runs')
      .select(`
        id,
        payroll_period_id,
        status,
        created_at,
        created_by,
        payroll_periods ( period_start, period_end, pay_date, pay_frequency )
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('payroll_status_history')
      .select(`
        status,
        reason,
        created_at,
        changed_by
      `)
      .eq('payroll_run_id', id)
      .order('created_at', { ascending: false })
  ])

  if (error || !run) {
    notFound()
  }

  // 2. Fetch Items
  const { data: items } = await supabase
    .from('payroll_items')
    .select(`
      id,
      gross_pay,
      net_pay,
      total_deductions,
      employees ( first_name, last_name, employee_code ),
      payroll_earnings (
        id,
        description,
        amount,
        calculated_amount,
        override_reason,
        override_by,
        override_at,
        is_taxable,
        source
      ),
      payroll_deductions ( id, description, amount, calculated_amount, override_reason )
    `)
    .eq('payroll_run_id', id)

  const payrollRun = run! as any;

  function getStatusIcon() {
    switch (payrollRun.status) {
      case 'Pending Approval': return <AlertCircle className="w-8 h-8 text-orange-600" />
      case 'Approved':
      case 'Paid': return <CheckCircle className="w-8 h-8 text-emerald-600" />
      case 'Rejected': return <XCircle className="w-8 h-8 text-red-600" />
      default: return <Clock className="w-8 h-8 text-slate-400" />
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-4">
        <Link href="/payroll" className="hover:text-slate-900 transition-colors">Payroll</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900">Run Details</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
            {getStatusIcon()}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Payroll: {new Date(payrollRun.payroll_periods.period_start).toLocaleDateString()} - {new Date(payrollRun.payroll_periods.period_end).toLocaleDateString()}
            </h2>
            <div className="flex items-center gap-2 text-slate-500 mt-1 font-medium">
              <span>{payrollRun.payroll_periods.pay_frequency}</span>
              <span>•</span>
              <span className={`
                ${run.status === 'Pending Approval' ? 'text-orange-600' : ''}
                ${(run.status === 'Approved' || run.status === 'Paid') ? 'text-emerald-600' : ''}
                ${run.status === 'Rejected' ? 'text-red-600' : ''}
              `}>
                {run.status}
              </span>
            </div>
          </div>
        </div>

        <PayrollActions 
          runId={run.id} 
          status={run.status} 
          periodId={payrollRun.payroll_period_id} 
        />
      </div>

      <StatutoryWarningBlock 
        runId={run.id} 
        periodId={payrollRun.payroll_period_id} 
        frequency={payrollRun.payroll_periods.pay_frequency} 
        periodStart={payrollRun.payroll_periods.period_start}
        periodEnd={payrollRun.payroll_periods.period_end}
      />


      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="register" className="w-full">
            <TabsList className="bg-slate-100 border border-slate-200 p-1 rounded-lg mb-4">
              <TabsTrigger value="register" className="rounded-md px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Payroll Register</TabsTrigger>
              <TabsTrigger value="diagnostics" className="rounded-md px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Diagnostics & Reconciliation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="register" className="mt-0">
              <Card className="bg-white rounded-xl border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Employee Details</h3>
                  <div className="text-sm text-slate-500 font-medium">Total Items: {items?.length || 0}</div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 font-medium">Employee</th>
                        <th className="px-6 py-3 font-medium text-right">Gross Pay</th>
                        <th className="px-6 py-3 font-medium text-right">Deductions</th>
                        <th className="px-6 py-3 font-medium text-right text-emerald-600">Net Pay</th>
                        <th className="px-6 py-3 font-medium text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(!items || items.length === 0) ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                            <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            <p>No items found for this payroll run.</p>
                          </td>
                        </tr>
                      ) : (
                        items.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-900">
                                {(item.employees as any)?.first_name} {(item.employees as any)?.last_name}
                              </div>
                              <div className="text-xs text-slate-500">{(item.employees as any)?.employee_code}</div>
                            </td>
                            <td className="px-6 py-4 text-right font-medium">
                              ₱{Number(item.gross_pay).toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </td>
                            <td className="px-6 py-4 text-right text-red-500">
                              - ₱{Number(item.total_deductions).toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-emerald-600">
                              ₱{Number(item.net_pay).toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </td>
                            <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                              <Dialog>
                                <DialogTrigger className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                  <Eye className="w-3.5 h-3.5" />
                                  Details
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Calculation Breakdown - {(item.employees as any)?.first_name} {(item.employees as any)?.last_name}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-6 py-4">
                                    <div>
                                      <h4 className="text-sm font-semibold text-slate-900 mb-2 pb-2 border-b border-slate-100">Earnings</h4>
                                      <div className="space-y-3">
                                        {(item as any).payroll_earnings?.map((e: any) => (
                                          <EarningOverridePanel
                                            key={e.id}
                                            earning={e}
                                            payrollRunId={run.id}
                                            isLocked={run.status === 'Approved' || run.status === 'Paid'}
                                          />
                                        ))}
                                        {(!(item as any).payroll_earnings || (item as any).payroll_earnings.length === 0) && (
                                          <p className="text-sm text-slate-500 italic">No earnings found.</p>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h4 className="text-sm font-semibold text-slate-900 mb-2 pb-2 border-b border-slate-100">Deductions</h4>
                                      <div className="space-y-2">
                                        {(item as any).payroll_deductions?.map((d: any, i: number) => (
                                          <div key={i} className="flex justify-between text-sm">
                                            <span className="text-slate-600">{d.description}</span>
                                            {Number(d.amount) === 0 && d.description.includes('Not Applicable') ? (
                                              <span className="font-medium text-slate-500">Not Applicable</span>
                                            ) : (
                                              <span className="font-medium text-red-600">-₱{Number(d.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                            )}
                                          </div>
                                        ))}
                                        {(!(item as any).payroll_deductions || (item as any).payroll_deductions.length === 0) && (
                                          <p className="text-sm text-slate-500 italic">No deductions found.</p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                                      <span className="font-bold text-slate-900">Net Pay</span>
                                      <span className="text-lg font-bold text-emerald-600">₱{Number(item.net_pay).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Link 
                                href={`/payroll/${run.id}/payslips/${item.id}`}
                                target="_blank"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Payslip
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="diagnostics" className="mt-0">
              <DiagnosticsTab payrollRunId={run.id} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="bg-white rounded-xl border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Status History</h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {history?.map((h: any, i: number) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-900">{h.status}</div>
                      <time className="text-xs font-medium text-slate-500">{new Date(h.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                    </div>
                    <div className="text-slate-500 text-sm">{h.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
