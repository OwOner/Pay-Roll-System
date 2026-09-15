"use client"

import { useState } from "react"
import { approvePayrollAdjustment, deletePayrollAdjustment } from "./actions"
import { CheckCircle, Trash2, Loader2, Clock, Check } from "lucide-react"

export default function AdjustmentsClient({ adjustments }: { adjustments: any[] }) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleApprove(id: string) {
    if (!confirm("Are you sure you want to approve this adjustment? It will be carried forward to the employee's next active payroll run.")) return
    
    setLoading(id)
    const res = await approvePayrollAdjustment(id)
    if (res.error) alert(res.error)
    setLoading(null)
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this pending adjustment?")) return
    
    setLoading(id)
    const res = await deletePayrollAdjustment(id)
    if (res.error) alert(res.error)
    setLoading(null)
  }

  const formatMoney = (amount: number) => {
    return Number(amount).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 font-medium">Status</th>
            <th className="px-6 py-4 font-medium">Employee</th>
            <th className="px-6 py-4 font-medium">Type</th>
            <th className="px-6 py-4 font-medium text-right">Amount</th>
            <th className="px-6 py-4 font-medium">Reason</th>
            <th className="px-6 py-4 font-medium">Filing Date</th>
            <th className="px-6 py-4 font-medium text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {adjustments.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                No payroll adjustments found.
              </td>
            </tr>
          ) : (
            adjustments.map(adj => (
              <tr key={adj.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  {adj.status === 'Pending' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200"><Clock className="w-3.5 h-3.5" /> Pending</span>}
                  {adj.status === 'Approved' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle className="w-3.5 h-3.5" /> Approved</span>}
                  {adj.status === 'Processed' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"><Check className="w-3.5 h-3.5" /> Settled</span>}
                </td>
                <td className="px-6 py-4 font-medium text-slate-900">
                  {adj.employees.first_name} {adj.employees.last_name}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{adj.description}</div>
                  <div className="text-xs text-slate-500">{adj.adjustment_type}</div>
                </td>
                <td className="px-6 py-4 text-right font-medium">
                  {adj.adjustment_type === 'Deduction' ? (
                    <span className="text-red-600">-{formatMoney(adj.amount)}</span>
                  ) : (
                    <span className="text-emerald-600">+{formatMoney(adj.amount)}</span>
                  )}
                </td>
                <td className="px-6 py-4 max-w-xs truncate text-slate-600" title={adj.reason}>
                  {adj.reason}
                </td>
                <td className="px-6 py-4 text-slate-500 text-xs">
                  {new Date(adj.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-center">
                  {adj.status === 'Pending' && (
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleApprove(adj.id)}
                        disabled={loading === adj.id}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Approve Adjustment"
                      >
                        {loading === adj.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(adj.id)}
                        disabled={loading === adj.id}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        {loading === adj.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
