import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

export default async function PayslipsPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: run, error } = await supabase
    .from('payroll_runs')
    .select(`
      id,
      status,
      payroll_periods ( period_start, period_end, pay_date, pay_frequency )
    `)
    .eq('id', id)
    .single()

  if (error || !run || (run.status !== 'Approved' && run.status !== 'Paid')) {
    notFound()
  }

  const { data: items } = await supabase
    .from('payroll_items')
    .select(`
      id,
      gross_pay,
      net_pay,
      total_deductions,
      employees ( first_name, last_name, employee_code, departments(name), positions(title) ),
      payroll_earnings ( description, amount ),
      payroll_deductions ( description, amount )
    `)
    .eq('payroll_run_id', id)

  const { data: company } = await supabase
    .from('company_settings')
    .select('*')
    .single()

  const periodStart = new Date((run.payroll_periods as any).period_start).toLocaleDateString()
  const periodEnd = new Date((run.payroll_periods as any).period_end).toLocaleDateString()
  const payDate = new Date((run.payroll_periods as any).pay_date).toLocaleDateString()

  // Split items into chunks of 2 for printing 2 per page
  const chunks = []
  const itemsArr = items || []
  for (let i = 0; i < itemsArr.length; i += 2) {
    chunks.push(itemsArr.slice(i, i + 2))
  }

  return (
    <div className="bg-white min-h-screen font-mono text-sm text-black p-4 print:p-0">
      <div className="max-w-4xl mx-auto space-y-8 print:space-y-0">
        <div className="mb-4 print:hidden flex justify-between items-center bg-slate-100 p-4 rounded-lg">
          <p className="text-slate-600">Print this page to generate payslip PDFs.</p>
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') window.print()
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            Print Payslips
          </button>
        </div>

        {chunks.map((chunk, pageIndex) => (
          <div key={pageIndex} className="print:break-after-page print:h-screen flex flex-col justify-between">
            {chunk.map((item, itemIndex) => {
              const emp = item.employees as any
              return (
                <div key={item.id} className="border-2 border-black p-6 w-full max-h-[48%] h-full box-border relative mb-8 print:mb-0">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <h1 className="font-bold text-xl uppercase tracking-widest">{company?.company_name || "Company Name"}</h1>
                    {company?.address && <p className="text-xs">{company.address}</p>}
                    <h2 className="font-bold mt-2 bg-black text-white py-1 uppercase tracking-widest">Payslip</h2>
                  </div>

                  {/* Employee Details */}
                  <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                    <div>
                      <div className="flex"><span className="w-24 font-bold">Employee:</span> <span>{emp.last_name}, {emp.first_name}</span></div>
                      <div className="flex"><span className="w-24 font-bold">ID Number:</span> <span>{emp.employee_code}</span></div>
                      <div className="flex"><span className="w-24 font-bold">Department:</span> <span>{emp.departments?.name || '-'}</span></div>
                      <div className="flex"><span className="w-24 font-bold">Position:</span> <span>{emp.positions?.title || '-'}</span></div>
                    </div>
                    <div>
                      <div className="flex"><span className="w-24 font-bold">Pay Period:</span> <span>{periodStart} to {periodEnd}</span></div>
                      <div className="flex"><span className="w-24 font-bold">Pay Date:</span> <span>{payDate}</span></div>
                    </div>
                  </div>

                  {/* Earnings & Deductions */}
                  <div className="grid grid-cols-2 gap-8 h-48">
                    {/* Earnings */}
                    <div>
                      <h3 className="font-bold border-b border-black mb-2 uppercase text-xs">Earnings</h3>
                      <div className="space-y-1 text-xs">
                        {(item.payroll_earnings as any[])?.map((e, i) => (
                          <div key={i} className="flex justify-between">
                            <span>{e.description}</span>
                            <span>{Number(e.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Deductions */}
                    <div>
                      <h3 className="font-bold border-b border-black mb-2 uppercase text-xs">Deductions</h3>
                      <div className="space-y-1 text-xs">
                        {(item.payroll_deductions as any[])?.filter(d => Number(d.amount) > 0).map((d, i) => (
                          <div key={i} className="flex justify-between">
                            <span>{d.description}</span>
                            <span>{Number(d.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="mt-4 grid grid-cols-2 gap-8 pt-2 border-t-2 border-black absolute bottom-6 w-[calc(100%-3rem)]">
                    <div className="flex justify-between font-bold">
                      <span>Total Earnings:</span>
                      <span>{Number(item.gross_pay).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div>
                      <div className="flex justify-between font-bold mb-2">
                        <span>Total Deductions:</span>
                        <span>{Number(item.total_deductions).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t-2 border-black pt-1 bg-gray-100 px-2 -mx-2">
                        <span>NET PAY:</span>
                        <span>{Number(item.net_pay).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {/* If there's an odd number of items, add an empty placeholder to keep the layout strict */}
            {chunk.length === 1 && <div className="h-[48%] print:block hidden"></div>}
          </div>
        ))}
      </div>
      
      {/* Script to trigger print automatically? Optional. */}
      <script dangerouslySetInnerHTML={{__html: `
        // Optional: window.print() on load
      `}} />
    </div>
  )
}
