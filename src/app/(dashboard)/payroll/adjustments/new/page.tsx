import { createClient } from "@/lib/supabase/server"
import { ChevronRight, FileEdit } from "lucide-react"
import Link from "next/link"
import AdjustmentFormClient from "./adjustment-form-client"

export default async function NewAdjustmentPage() {
  const supabase = await createClient()

  const [{ data: employees }, { data: payrollRuns }] = await Promise.all([
    supabase
      .from('employees')
      .select('id, first_name, last_name, employee_code')
      .order('last_name'),
    supabase
      .from('payroll_runs')
      .select(`
        id,
        status,
        payroll_periods (
          period_start,
          period_end
        ),
        payroll_items (
          id,
          employee_id
        )
      `)
      .in('status', ['Approved', 'Paid'])
      .order('created_at', { ascending: false })
  ])

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-4">
        <Link href="/payroll" className="hover:text-slate-900 transition-colors">Payroll</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/payroll/adjustments" className="hover:text-slate-900 transition-colors">Adjustments</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900">New Adjustment</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
          <FileEdit className="w-8 h-8 text-slate-700" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">File Payroll Adjustment</h2>
          <p className="text-slate-500 mt-1 font-medium">Record a retroactive correction against a locked payroll period.</p>
        </div>
      </div>

      <AdjustmentFormClient 
        employees={employees || []} 
        payrollRuns={payrollRuns || []} 
      />
    </div>
  )
}
