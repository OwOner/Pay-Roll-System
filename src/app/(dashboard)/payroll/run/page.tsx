"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { PlayCircle, Loader2, Save, Send, Eye } from "lucide-react"
import { previewPayrollRun, submitPayrollRun } from "./actions"
import { format, parseISO } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
                <select name="pay_frequency" defaultValue={formData?.get('pay_frequency')?.toString() || "Weekly"} required className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50">
                  <option value="Semi-Monthly">Semi-Monthly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Daily">Daily</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Pay Date (Payout)</label>
                <input type="date" name="pay_date" defaultValue={formData?.get('pay_date')?.toString() || format(new Date(), 'yyyy-MM-dd')} required className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Period Start</label>
                <input type="date" name="period_start" defaultValue={formData?.get('period_start')?.toString() || format(new Date(new Date().setDate(new Date().getDate() - new Date().getDay() - 7)), 'yyyy-MM-dd')} required className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Period End</label>
                <input type="date" name="period_end" defaultValue={formData?.get('period_end')?.toString() || format(new Date(new Date().setDate(new Date().getDate() - new Date().getDay() - 1)), 'yyyy-MM-dd')} required className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50" />
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
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Calculation Preview</h3>
                {formData && (
                  <p className="text-sm text-slate-500 mt-1">
                    {formData.get('pay_frequency') as string} Period: <span className="font-medium text-slate-700">{formData.get('period_start') ? format(new Date(...(formData.get('period_start') as string).split('-').map((v, i) => i === 1 ? parseInt(v) - 1 : parseInt(v)) as [number, number, number]), 'MMM d, yyyy') : ''}</span> to <span className="font-medium text-slate-700">{formData.get('period_end') ? format(new Date(...(formData.get('period_end') as string).split('-').map((v, i) => i === 1 ? parseInt(v) - 1 : parseInt(v)) as [number, number, number]), 'MMM d, yyyy') : ''}</span>
                  </p>
                )}
              </div>
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
                    <th className="px-6 py-3 font-medium text-center">Actions</th>
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
                        {row.status === 'Ready' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Ready</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-800 max-w-xs text-left">
                            {row.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.status === 'Ready' && (
                          <Dialog>
                            <DialogTrigger className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                              <Eye className="w-3.5 h-3.5" />
                              Details
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Calculation Breakdown - {row.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6 py-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-900 mb-2 pb-2 border-b border-slate-100">Earnings</h4>
                                  <div className="space-y-2">
                                    {row.earnings?.map((e: any, i: number) => (
                                      <div key={i} className="flex justify-between text-sm">
                                        <span className="text-slate-600">{e.description}</span>
                                        <span className="font-medium text-slate-900">₱{e.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                      </div>
                                    ))}
                                    {(!row.earnings || row.earnings.length === 0) && (
                                      <p className="text-sm text-slate-500 italic">No earnings found.</p>
                                    )}
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-900 mb-2 pb-2 border-b border-slate-100">Deductions</h4>
                                  <div className="space-y-2">
                                    {row.deductions?.map((d: any, i: number) => (
                                      <div key={i} className="flex justify-between text-sm">
                                        <span className="text-slate-600">{d.description}</span>
                                        {d.amount === 0 && d.description.includes('Not Applicable') ? (
                                          <span className="font-medium text-slate-500">Not Applicable</span>
                                        ) : (
                                          <span className="font-medium text-red-600">-₱{d.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                        )}
                                      </div>
                                    ))}
                                    {(!row.deductions || row.deductions.length === 0) && (
                                      <p className="text-sm text-slate-500 italic">No deductions found.</p>
                                    )}
                                  </div>
                                </div>

                                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                                  <span className="font-bold text-slate-900">Net Pay</span>
                                  <span className="text-lg font-bold text-emerald-600">₱{row.net_pay.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
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
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm"
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
