import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Printer, Mail } from "lucide-react"

export default async function PayslipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // 1. Fetch Payroll Item with all related snapshots and periods
  const { data: item, error } = await supabase
    .from('payroll_items')
    .select(`
      id,
      gross_pay,
      taxable_income,
      non_taxable_income,
      withholding_tax,
      total_deductions,
      net_pay,
      employee_id,
      payroll_runs!inner (
        status,
        payroll_periods ( period_start, period_end, pay_date, pay_frequency )
      ),
      employees ( first_name, last_name, employee_id, job_title, department_id, basic_salary, employment_type )
    `)
    .eq('id', id)
    .single()

  if (error || !item) notFound()

  // Basic RLS/Security Check
  const { data: profile } = await supabase.from('profiles').select('roles(name)').eq('id', user.id).single()
  const roleName = (profile?.roles as any)?.name
  const isAdmin = roleName === 'Super Admin' || roleName === 'Payroll Manager'
  
  if (!isAdmin) {
    const { data: emp } = await supabase.from('employees').select('id').eq('user_id', user.id).single()
    if (item.employee_id !== emp?.id) {
      notFound() // Prevent viewing others' payslips
    }
  }

  // 2. Fetch Earnings & Deductions concurrently
  const [{ data: earnings }, { data: deductions }] = await Promise.all([
    supabase
      .from('payroll_earnings')
      .select('description, amount, is_taxable')
      .eq('payroll_item_id', id),
    supabase
      .from('payroll_deductions')
      .select('description, amount')
      .eq('payroll_item_id', id)
  ])

  const payslipItem = item as any;

  const displayEarnings = earnings || [];
  const displayDeductions = deductions || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Non-printable controls */}
      <div className="flex justify-between items-center print:hidden bg-slate-900 p-4 rounded-xl text-white shadow-lg">
        <div>
          <h2 className="font-bold">Payslip Actions</h2>
          <p className="text-slate-400 text-sm">Print or email this document.</p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 bg-slate-800 text-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-700 transition-colors border border-slate-700">
            <Mail className="w-4 h-4" /> Email Payslip (Coming soon)
          </button>
          <button 
            // Bound via script below
            className="inline-flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-lg font-bold hover:bg-slate-100 transition-colors payslip-print-btn"
          >
            <Printer className="w-4 h-4" /> Print to PDF
          </button>
        </div>
      </div>

      {/* Printable Payslip */}
      <Card className="bg-white rounded-none sm:rounded-xl border-slate-200 sm:shadow-md p-8 sm:p-12 print:shadow-none print:border-none print:p-0">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">Nexus Corp.</h1>
            <p className="text-slate-500 mt-1 font-medium">123 Corporate Tower, Ayala Ave, Makati City</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-slate-300 uppercase tracking-widest">Payslip</h2>
            <p className="text-slate-900 font-bold mt-2">
              {new Date(payslipItem.payroll_runs.payroll_periods.period_start).toLocaleDateString()} - {new Date(payslipItem.payroll_runs.payroll_periods.period_end).toLocaleDateString()}
            </p>
            <p className="text-slate-500 text-sm font-medium">Payout: {new Date(payslipItem.payroll_runs.payroll_periods.pay_date).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Employee Info */}
        <div className="grid grid-cols-2 gap-8 mb-8 bg-slate-50 p-6 rounded-lg border border-slate-100 print:bg-transparent print:border-none print:p-0">
          <div>
            <p className="text-sm text-slate-500 mb-1">Employee Name</p>
            <p className="font-bold text-slate-900 text-lg uppercase">{payslipItem.employees.first_name} {payslipItem.employees.last_name}</p>
            <p className="text-sm text-slate-700 font-medium">{payslipItem.employees.job_title || 'Employee'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500 mb-1">Employee ID</p>
            <p className="font-bold text-slate-900 uppercase">{payslipItem.employees.employee_id}</p>
            <p className="text-sm text-slate-700 font-medium">{payslipItem.employees.employment_type}</p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Earnings */}
          <div>
            <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 uppercase text-sm tracking-wider">Earnings</h3>
            <div className="space-y-3">
              {displayEarnings.map((e: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-700">{e.description}</span>
                  <span className="font-medium text-slate-900">₱{e.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-slate-900 mt-6 pt-4 border-t border-slate-200">
              <span>Gross Pay</span>
              <span>₱{item.gross_pay.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 uppercase text-sm tracking-wider">Deductions</h3>
            <div className="space-y-3">
              {displayDeductions.map((d: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-700">{d.description}</span>
                  <span className="font-medium text-slate-900">₱{d.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-red-600 mt-6 pt-4 border-t border-slate-200">
              <span>Total Deductions</span>
              <span>-₱{item.total_deductions.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>

        {/* Net Pay */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex justify-between items-center print:border-t-4 print:border-emerald-600 print:bg-transparent print:rounded-none">
          <div>
            <h3 className="font-bold text-emerald-900 uppercase tracking-widest text-sm">Net Pay</h3>
            <p className="text-emerald-700 text-sm font-medium">Transferred to Bank Account</p>
          </div>
          <div className="text-4xl font-black text-emerald-600 tracking-tight">
            ₱{item.net_pay.toLocaleString(undefined, {minimumFractionDigits: 2})}
          </div>
        </div>

      </Card>
      
      {/* Script for printing via the button since it's a server component */}
      <script dangerouslySetInnerHTML={{__html: `
        document.querySelector('.payslip-print-btn')?.addEventListener('click', function(e) {
          e.preventDefault();
          window.print();
        });
      `}} />
    </div>
  )
}
