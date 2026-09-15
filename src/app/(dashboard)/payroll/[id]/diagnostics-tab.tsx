"use client"

import { useEffect, useState } from "react"
import { getPayrollDiagnostics } from "./reconciliation-actions"
import { ReconciliationResult, DiagnosticIssue } from "@/lib/payroll/reconciliation"
import { Loader2, AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react"

export default function DiagnosticsTab({ payrollRunId }: { payrollRunId: string }) {
  const [data, setData] = useState<ReconciliationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all')

  useEffect(() => {
    getPayrollDiagnostics(payrollRunId).then(res => {
      setData(res)
      setLoading(false)
    })
  }, [payrollRunId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400 mb-4" />
        <p className="text-slate-500 font-medium">Running mathematical integrity checks & anomaly detection...</p>
      </div>
    )
  }

  if (!data) return null

  const getFilteredIssues = () => {
    const all = [...data.errors, ...data.warnings, ...data.infos]
    if (filter === 'all') return all
    return all.filter(i => i.severity === filter)
  }

  const issues = getFilteredIssues()

  return (
    <div className="space-y-6">
      {/* Summary Dashboard */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${data.errors.length > 0 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
          <AlertCircle className="w-5 h-5" />
          {data.errors.length} Blocking {data.errors.length === 1 ? 'Error' : 'Errors'}
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${data.warnings.length > 0 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
          <AlertTriangle className="w-5 h-5" />
          {data.warnings.length} {data.warnings.length === 1 ? 'Warning' : 'Warnings'}
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Info className="w-5 h-5" />
          {data.infos.length} Info
        </div>
        
        <div className="flex-1" />

        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold border ${data.passedMath ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {data.passedMath ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {data.passedMath ? 'Mathematical Reconciliation Passed' : 'Mathematical Mismatch Detected'}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg w-fit">
        {(['all', 'error', 'warning', 'info'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Issues List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {issues.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="font-medium text-lg">No anomalies found</p>
            <p className="text-sm">The payroll run looks completely clean for this filter.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 font-medium">Employee</th>
                <th className="px-6 py-3 font-medium">Issue</th>
                <th className="px-6 py-3 font-medium">Change / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issues.map((issue, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {issue.severity === 'error' && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
                      {issue.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />}
                      {issue.severity === 'info' && <Info className="w-4 h-4 text-blue-500 shrink-0" />}
                      <span className="font-medium text-slate-900">{issue.employeeName || 'System'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {issue.type.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900">{issue.message}</span>
                    {issue.reasons.length > 0 && (
                      <ul className="mt-1 space-y-1 text-xs text-slate-500 list-disc list-inside">
                        {issue.reasons.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
