"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createPayrollAdjustment } from "../actions"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function AdjustmentFormClient({ 
  employees, 
  payrollRuns 
}: { 
  employees: any[], 
  payrollRuns: any[] 
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [employeeId, setEmployeeId] = useState("")
  const [runId, setRunId] = useState("")
  
  // Filter runs for the selected employee
  // A run is only relevant if it has a payroll_item for this employee
  const availableItems = payrollRuns.flatMap(run => 
    run.payroll_items
      .filter((item: any) => item.employee_id === employeeId)
      .map((item: any) => ({
        itemId: item.id,
        runId: run.id,
        periodDisplay: `${new Date(run.payroll_periods.period_start).toLocaleDateString()} - ${new Date(run.payroll_periods.period_end).toLocaleDateString()} (${run.status})`
      }))
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const data = new FormData(e.currentTarget)
    
    const res = await createPayrollAdjustment({
      employeeId: data.get("employeeId") as string,
      referenceItemId: data.get("referenceItemId") as string,
      adjustmentType: data.get("adjustmentType") as string,
      category: data.get("category") as string,
      amount: Number(data.get("amount")),
      reason: data.get("reason") as string,
    })

    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      router.push("/payroll/adjustments")
    }
  }

  return (
    <Card className="max-w-2xl bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Employee</label>
            <select 
              name="employeeId" 
              required
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={employeeId}
              onChange={(e) => {
                setEmployeeId(e.target.value)
                setRunId("")
              }}
            >
              <option value="">Select Employee...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.last_name}, {emp.first_name} ({emp.employee_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reference Payroll Run (Optional)</label>
            <select 
              name="referenceItemId" 
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
              disabled={!employeeId}
              value={runId}
              onChange={(e) => setRunId(e.target.value)}
            >
              <option value="">None / General Adjustment</option>
              {availableItems.map(item => (
                <option key={item.itemId} value={item.itemId}>
                  {item.periodDisplay}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">Select the locked payroll period this correction applies to.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Adjustment Type</label>
              <select 
                name="adjustmentType" 
                required
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="Hours Correction">Hours Correction</option>
                <option value="Missed Earning">Missed Earning</option>
                <option value="Statutory Correction">Statutory Correction</option>
                <option value="Loan Correction">Loan Correction</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select 
                name="category" 
                required
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="Earning">Earning (Addition)</option>
                <option value="Deduction">Deduction (Reduction)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monetary Amount (₱)</label>
            <input 
              type="number" 
              name="amount" 
              required
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <p className="text-xs text-slate-500 mt-1">Enter the exact fiat monetary amount (do not enter raw hours).</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason / Notes</label>
            <textarea 
              name="reason" 
              required
              rows={3}
              placeholder="Explain the reason for this retroactive adjustment..."
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Adjustment
          </button>
        </div>
      </form>
    </Card>
  )
}
