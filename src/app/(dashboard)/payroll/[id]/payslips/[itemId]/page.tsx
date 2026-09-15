import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Printer } from "lucide-react"

export default async function PayslipPage({ params }: { params: Promise<{ id: string, itemId: string }> }) {
  const { id: runId, itemId } = await params
  const supabase = await createClient()

  const { data: item, error } = await supabase
    .from('payroll_items')
    .select(`
      *,
      employees (
        id,
        first_name,
        last_name,
        employee_code,
        department_id,
        position_id,
        departments ( name ),
        positions ( title )
      ),
      payroll_runs (
        id,
        payroll_periods (
          period_start,
          period_end,
          pay_date,
          pay_frequency
        )
      ),
      payroll_earnings (
        id,
        type,
        description,
        amount,
        is_taxable,
        tax_treatment
      ),
      payroll_deductions (
        id,
        type,
        description,
        amount,
        is_pre_tax
      )
    `)
    .eq('id', itemId)
    .eq('payroll_run_id', runId)
    .single()

  if (error || !item) {
    notFound()
  }

  const employee = item.employees as any
  const run = item.payroll_runs as any
  const period = run.payroll_periods
  
  const earnings = item.payroll_earnings as any[] || []
  const deductions = item.payroll_deductions as any[] || []

  // Categorize Earnings
  const taxableEarnings = earnings.filter(e => e.is_taxable)
  const nonTaxableEarnings = earnings.filter(e => !e.is_taxable)

  // Categorize Deductions
  const statutoryDeductions = deductions.filter(d => d.is_pre_tax)
  const withholdingTax = deductions.find(d => d.type === 'Tax')
  const postTaxDeductions = deductions.filter(d => !d.is_pre_tax && d.type !== 'Tax')

  const formatMoney = (amount: number) => {
    return Number(amount).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto">
        {/* Action Bar - Hidden in Print */}
        <div className="flex justify-end mb-6 print:hidden">
          <button 
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print Payslip
          </button>
        </div>

        {/* Payslip Document */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 print:border-none print:shadow-none print:p-4">
          
          {/* Header */}
          <div className="text-center mb-8 border-b border-slate-200 pb-6">
            <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wider mb-1">Nexus Corporation</h1>
            <p className="text-slate-500 font-medium text-sm">PAYSLIP</p>
          </div>

          {/* Employee & Period Details */}
          <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
            <div>
              <div className="grid grid-cols-[100px_1fr] gap-2 mb-2">
                <span className="text-slate-500 font-medium">Employee Name:</span>
                <span className="font-bold text-slate-900">{employee.first_name} {employee.last_name}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 mb-2">
                <span className="text-slate-500 font-medium">Employee ID:</span>
                <span className="text-slate-900">{employee.employee_code}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="text-slate-500 font-medium">Position:</span>
                <span className="text-slate-900">{employee.positions?.title || '-'}</span>
              </div>
            </div>
            <div>
              <div className="grid grid-cols-[100px_1fr] gap-2 mb-2">
                <span className="text-slate-500 font-medium">Pay Period:</span>
                <span className="text-slate-900">
                  {new Date(period.period_start).toLocaleDateString()} - {new Date(period.period_end).toLocaleDateString()}
                </span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 mb-2">
                <span className="text-slate-500 font-medium">Pay Date:</span>
                <span className="text-slate-900">{new Date(period.pay_date).toLocaleDateString()}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="text-slate-500 font-medium">Frequency:</span>
                <span className="text-slate-900">{period.pay_frequency}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Left Column: Earnings */}
            <div>
              <h3 className="font-bold text-slate-900 border-b-2 border-slate-900 pb-2 mb-4 uppercase text-xs tracking-wider">Earnings</h3>
              
              {/* Taxable Earnings */}
              <div className="space-y-2 mb-4 text-sm">
                {taxableEarnings.map(e => (
                  <div key={e.id} className="flex justify-between">
                    <span className="text-slate-700">{e.description}</span>
                    <span className="font-medium">{formatMoney(e.amount)}</span>
                  </div>
                ))}
              </div>

              {/* Non-Taxable Earnings */}
              {nonTaxableEarnings.length > 0 && (
                <>
                  <h4 className="font-semibold text-slate-700 border-b border-slate-100 pb-1 mb-3 text-xs uppercase mt-6">Non-Taxable Earnings</h4>
                  <div className="space-y-2 text-sm">
                    {nonTaxableEarnings.map(e => (
                      <div key={e.id} className="flex justify-between">
                        <span className="text-slate-700 flex flex-col">
                          {e.description}
                          {e.tax_treatment === 'mwe_exempt' && <span className="text-[10px] text-slate-500 uppercase">MWE Exempt</span>}
                        </span>
                        <span className="font-medium">{formatMoney(e.amount)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 mt-4 pt-2">
                <span>Gross Pay</span>
                <span>{formatMoney(item.gross_pay)}</span>
              </div>
            </div>

            {/* Right Column: Deductions */}
            <div>
              <h3 className="font-bold text-slate-900 border-b-2 border-slate-900 pb-2 mb-4 uppercase text-xs tracking-wider">Deductions</h3>
              
              {/* Statutory Deductions */}
              {statutoryDeductions.length > 0 && (
                <>
                  <h4 className="font-semibold text-slate-700 border-b border-slate-100 pb-1 mb-3 text-xs uppercase">Statutory (Pre-Tax)</h4>
                  <div className="space-y-2 mb-4 text-sm text-red-600">
                    {statutoryDeductions.map(d => (
                      <div key={d.id} className="flex justify-between">
                        <span>{d.description}</span>
                        <span className="font-medium">-{formatMoney(d.amount)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Withholding Tax */}
              {withholdingTax && (
                <>
                  <h4 className="font-semibold text-slate-700 border-b border-slate-100 pb-1 mb-3 text-xs uppercase">Taxes</h4>
                  <div className="space-y-2 mb-4 text-sm text-red-600">
                    <div className="flex justify-between">
                      <span>{withholdingTax.description}</span>
                      <span className="font-medium">-{formatMoney(withholdingTax.amount)}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Post-Tax Deductions */}
              {postTaxDeductions.length > 0 && (
                <>
                  <h4 className="font-semibold text-slate-700 border-b border-slate-100 pb-1 mb-3 text-xs uppercase">Other Deductions</h4>
                  <div className="space-y-2 mb-4 text-sm text-red-600">
                    {postTaxDeductions.map(d => (
                      <div key={d.id} className="flex justify-between">
                        <span>{d.description}</span>
                        <span className="font-medium">-{formatMoney(d.amount)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="flex justify-between font-bold text-red-600 border-t border-slate-200 mt-4 pt-2">
                <span>Total Deductions</span>
                <span>-{formatMoney(item.total_deductions)}</span>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="mt-12 bg-slate-50 border border-slate-200 p-6 rounded-lg print:bg-transparent print:border-t-2 print:border-slate-900 print:rounded-none flex justify-between items-center">
            <span className="text-lg font-bold text-slate-900 uppercase tracking-wider">Net Pay</span>
            <span className="text-3xl font-black text-emerald-600 print:text-slate-900">{formatMoney(item.net_pay)}</span>
          </div>

        </div>
        
        {/* Simple Client Component for Print trigger */}
        <PrintScript />
      </div>
    </div>
  )
}

function PrintScript() {
  return (
    <script dangerouslySetInnerHTML={{__html: `
      document.querySelector('button')?.addEventListener('click', () => {
        window.print();
      });
    `}} />
  )
}
