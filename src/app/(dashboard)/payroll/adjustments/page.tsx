import { createClient } from "@/lib/supabase/server"
import { ChevronRight, FileEdit, Plus } from "lucide-react"
import Link from "next/link"
import AdjustmentsClient from "./adjustments-client"
import { Card } from "@/components/ui/card"

export default async function AdjustmentsPage() {
  const supabase = await createClient()

  const { data: adjustments } = await supabase
    .from('payroll_adjustments')
    .select(`
      *,
      employees (
        id,
        first_name,
        last_name,
        employee_code
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-4">
        <Link href="/payroll" className="hover:text-slate-900 transition-colors">Payroll</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900">Adjustments</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
            <FileEdit className="w-8 h-8 text-slate-700" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Payroll Adjustments</h2>
            <p className="text-slate-500 mt-1 font-medium">Manage retroactive corrections to locked payroll periods.</p>
          </div>
        </div>

        <Link
          href="/payroll/adjustments/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          File Adjustment
        </Link>
      </div>

      <Card className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <AdjustmentsClient adjustments={adjustments || []} />
      </Card>
    </div>
  )
}
