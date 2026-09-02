"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { PlayCircle, Loader2, Save, Send } from "lucide-react"
import { previewPayrollRun, submitPayrollRun } from "./actions"

export default function RunPayrollPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form State
  const [formData, setFormData] = useState<FormData | null>(null)
  const [preview, setPreview] = useState<any[]>([])

  async function handlePreview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const data = new FormData(e.currentTarget)
    setFormData(data)
    
    const result = await previewPayrollRun(data)
    
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.preview) {
      setPreview(result.preview)
      setStep(2)
    }
    setLoading(false)
  }

  async function handleSubmit(status: 'Draft' | 'Pending Approval') {
    if (!formData) return
    setLoading(true)
    setError(null)

    const result = await submitPayrollRun(formData, status)
    
    if (result.error) {
      setError(result.error)
      setLoading(false)
    }
    // Success redirects in action
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Run Payroll</h2>
        <p className="text-slate-500">Select the period to calculate and preview before generating.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 font-medium text-sm">
          {error}
        </div>
      )}

      {step === 1 && (
        <Card className="bg-white rounded-xl border-slate-200 shadow-sm p-6">
          <form onSubmit={handlePreview} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Pay Frequency</label>
                <select name="pay_frequency" required className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50">
                  <option value="Semi-Monthly">Semi-Monthly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Daily">Daily</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Pay Date (Payout)</label>
                <input type="date" name="pay_date" required className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Period Start</label>
                <input type="date" name="period_start" required className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Period End</label>
                <input type="date" name="period_end" required className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50" />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                type="submit" 
                disabled={loading}
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                Calculate & Preview
              </button>
            </div>
          </form>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Card className="bg-white rounded-xl border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Calculation Preview</h3>
              <button 
                onClick={() => setStep(1)}
                className="text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                Edit Period
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 font-medium">Employee</th>
                    <th className="px-6 py-3 font-medium text-right">Gross Pay</th>
                    <th className="px-6 py-3 font-medium text-right">Deductions</th>
                    <th className="px-6 py-3 font-medium text-right text-emerald-600">Net Pay</th>
                    <th className="px-6 py-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.map((row) => (
                    <tr key={row.employee_id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{row.name}</td>
                      <td className="px-6 py-4 text-right">₱{row.gross_pay.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      <td className="px-6 py-4 text-right text-red-600">-₱{row.total_deductions.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">₱{row.net_pay.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      <td className="px-6 py-4 text-center text-slate-500">
                        {row.status === 'Ready' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Ready</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-sm text-slate-500">Preview is server-authoritative. Calculations cannot be modified manually without overriding active configurations.</span>
            <div className="flex gap-3">
              <button 
                onClick={() => handleSubmit('Draft')}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-white text-slate-900 border border-slate-200 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save as Draft
              </button>
              <button 
                onClick={() => handleSubmit('Pending Approval')}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit for Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
