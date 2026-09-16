import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PrintButton } from "@/components/ui/print-button"

export default async function PayrollSignatureSheet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch Payroll Run Details
  const { data: run, error } = await supabase
    .from('payroll_runs')
    .select(`
      id,
      payroll_period_id,
      status,
      payroll_periods ( period_start, period_end, pay_date, pay_frequency )
    `)
    .eq('id', id)
    .single()

  if (error || !run) {
    notFound()
  }

  const payrollRun = run as any

  // 2. Fetch non-excluded Items
  const { data: items } = await supabase
    .from('payroll_items')
    .select(`
      id,
      is_excluded,
      employee_id,
      employees ( first_name, last_name, employee_code, departments(name) )
    `)
    .eq('payroll_run_id', id)
    .eq('is_excluded', false)
    
  // 3. Fetch Timesheets for present/absent days
  const { data: timesheets } = await supabase
    .from('timesheets')
    .select('employee_id, calculated_present_days, calculated_absent_days')
    .eq('payroll_period_id', payrollRun.payroll_period_id)

  const { data: company } = await supabase
    .from('company_settings')
    .select('*')
    .single()

  const activeItems = (items || []).map(item => {
    const ts = timesheets?.find(t => t.employee_id === item.employee_id)
    return {
      ...item,
      presentDays: ts?.calculated_present_days || 0,
      absentDays: ts?.calculated_absent_days || 0
    }
  }).sort((a, b) => {
    const aName = ((a.employees as any)?.last_name || '').toLowerCase()
    const bName = ((b.employees as any)?.last_name || '').toLowerCase()
    return aName.localeCompare(bName)
  })

  return (
    <div className="bg-slate-50 min-h-screen print:min-h-0 font-sans">
      {/* Non-printable header */}
      <div className="print:hidden bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href={`/payroll/${run.id}`}>
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Run
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-200"></div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Signature Sheet (Blank)</h1>
            <p className="text-xs text-slate-500">
              {new Date(payrollRun.payroll_periods.period_start).toLocaleDateString()} - {new Date(payrollRun.payroll_periods.period_end).toLocaleDateString()}
            </p>
          </div>
        </div>
        <PrintButton />
      </div>

      {/* Printable Sheet */}
      <div className="p-8 print:p-0 print:bg-white mx-auto max-w-5xl">
        <div className="bg-white p-10 print:p-0 shadow-sm rounded-xl print:shadow-none print:rounded-none">
          <div className="text-center mb-8">
            <h1 className="font-bold text-2xl uppercase tracking-widest text-slate-900">{company?.company_name || "Company Name"}</h1>
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-700 mt-2">Attendance Signature Sheet</h2>
            <div className="mt-2 text-slate-600">
              <p><strong>Pay Period:</strong> {new Date(payrollRun.payroll_periods.period_start).toLocaleDateString()} to {new Date(payrollRun.payroll_periods.period_end).toLocaleDateString()}</p>
            </div>
            <p className="mt-4 text-sm text-slate-500 max-w-2xl mx-auto">
              By signing below, I acknowledge that the reported attendance days are correct for the period indicated above.
            </p>
          </div>

          <table className="w-full text-sm text-left border-collapse border border-slate-300">
            <thead className="print:table-header-group">
              <tr className="bg-slate-100 print:bg-slate-100">
                <th className="border border-slate-300 px-4 py-3 font-semibold text-slate-900 w-12 text-center">#</th>
                <th className="border border-slate-300 px-4 py-3 font-semibold text-slate-900">Employee Name</th>
                <th className="border border-slate-300 px-4 py-3 font-semibold text-slate-900 w-24 text-center">Days Present</th>
                <th className="border border-slate-300 px-4 py-3 font-semibold text-slate-900 w-24 text-center">Days Absent</th>
                <th className="border border-slate-300 px-4 py-3 font-semibold text-slate-900 w-64 text-center">Signature</th>
              </tr>
            </thead>
            <tbody className="print:table-row-group">
              {activeItems.map((item, index) => (
                <tr key={item.id} className="print:break-inside-avoid">
                  <td className="border border-slate-300 px-4 py-4 text-center text-slate-500">{index + 1}</td>
                  <td className="border border-slate-300 px-4 py-4 font-medium text-slate-900">
                    {(item.employees as any)?.last_name}, {(item.employees as any)?.first_name}
                  </td>
                  <td className="border border-slate-300 px-4 py-4 text-center text-slate-700">
                    {item.presentDays}
                  </td>
                  <td className="border border-slate-300 px-4 py-4 text-center text-slate-700">
                    {item.absentDays}
                  </td>
                  <td className="border border-slate-300 px-4 py-4">
                    {/* Blank line for signature */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {activeItems.length === 0 && (
            <div className="text-center py-8 text-slate-500 border-x border-b border-slate-300">
              No active employees in this run.
            </div>
          )}
          
          <div className="mt-12 flex justify-between text-sm text-slate-500">
            <div>
              <p>Printed on: {new Date().toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p>Total Employees: {activeItems.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
