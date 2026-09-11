"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { PlayCircle, Loader2, Save, Send, Eye, ChevronDown } from "lucide-react"
import { previewPayrollRun, submitPayrollRun } from "./actions"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// --- helpers ---
function prevMonday(d: Date) {
  const day = d.getDay() // 0=Sun,1=Mon,...,6=Sat
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff - 7)
  return monday
}
function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}
function fmt(d: Date) { return format(d, 'yyyy-MM-dd') }
function fmtDisplay(s: string) {
  // parse yyyy-MM-dd without timezone shift
  const [y, m, d] = s.split('-').map(Number)
  return format(new Date(y, m - 1, d), 'MMM d, yyyy')
}

export default function RunPayrollPage() {
  const today = new Date()
  const defaultStart = fmt(prevMonday(today))
  const defaultEnd = fmt(addDays(prevMonday(today), 6))
  const defaultPayDate = fmt(addDays(prevMonday(today), 8)) // Wednesday next week

  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Period form values — remembered across steps
  const [periodStart, setPeriodStart] = useState(defaultStart)
  const [periodEnd, setPeriodEnd] = useState(defaultEnd)
  const [payFrequency, setPayFrequency] = useState("Weekly")
  const [payDate, setPayDate] = useState(defaultPayDate)

  const [preview, setPreview] = useState<any[]>([])

  // Persist last-used period in localStorage so returning to the page pre-fills it
  useEffect(() => {
    const saved = localStorage.getItem('payroll_run_period')
    if (saved) {
      try {
        const p = JSON.parse(saved)
        if (p.start) setPeriodStart(p.start)
        if (p.end) setPeriodEnd(p.end)
        if (p.freq) setPayFrequency(p.freq)
        if (p.payDate) setPayDate(p.payDate)
      } catch {}
    }
  }, [])

  function savePeriod() {
    localStorage.setItem('payroll_run_period', JSON.stringify({
      start: periodStart, end: periodEnd, freq: payFrequency, payDate
    }))
  }

  async function handlePreview() {
    setLoading(true)
    setError(null)
    savePeriod()

    const data = new FormData()
    data.set('period_start', periodStart)
    data.set('period_end', periodEnd)
    data.set('pay_frequency', payFrequency)
    data.set('pay_date', payDate)

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
    setLoading(true)
    setError(null)

    const data = new FormData()
    data.set('period_start', periodStart)
    data.set('period_end', periodEnd)
    data.set('pay_frequency', payFrequency)
    data.set('pay_date', payDate)

    const result = await submitPayrollRun(data, status)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    }
    // Success redirects in action
  }

  const allReady = preview.length > 0 && preview.every(r => r.status === 'Ready')
  const hasWarnings = preview.some(r => r.status.startsWith('Warning'))
  const hasErrors = preview.some(r => r.status.startsWith('Error'))

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Run Payroll</h2>
        <p className="text-slate-500">Select the period, preview, then generate the payroll run.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 font-medium text-sm">
          {error}
        </div>
      )}

      {/* Period bar — always visible, collapsed in step 2 */}
      <Card className="bg-white rounded-xl border-slate-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">

          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Frequency</label>
              <select
                value={payFrequency}
                onChange={e => setPayFrequency(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:outline-none"
              >
                <option value="Semi-Monthly">Semi-Monthly</option>
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
                <option value="Daily">Daily</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Period Start</label>
              <input
                type="date"
                value={periodStart}
                onChange={e => setPeriodStart(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Period End</label>
              <input
                type="date"
                value={periodEnd}
                onChange={e => setPeriodEnd(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pay Date</label>
              <input
                type="date"
                value={payDate}
                onChange={e => setPayDate(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handlePreview}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 shrink-0 h-[38px]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
            {step === 2 ? 'Re-calculate' : 'Calculate & Preview'}
          </button>
        </div>
      </Card>

      {/* Preview table */}
      {step === 2 && (
        <div className="space-y-6">
          <Card className="bg-white rounded-xl border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Calculation Preview</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {payFrequency} Period:{' '}
                  <span className="font-medium text-slate-700">{fmtDisplay(periodStart)}</span>
                  {' '}to{' '}
                  <span className="font-medium text-slate-700">{fmtDisplay(periodEnd)}</span>
                </p>
              </div>
              {(hasWarnings || hasErrors) && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-xs">
                  ⚠️ Some employees have warnings or errors. Review before submitting.
                </div>
              )}
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
                      <td className="px-6 py-4 text-right">{row.gross_pay !== null ? `₱${row.gross_pay.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '—'}</td>
                      <td className="px-6 py-4 text-right text-red-600">{row.total_deductions !== null ? `-₱${row.total_deductions.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '—'}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">{row.net_pay !== null ? `₱${row.net_pay.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '—'}</td>
                      <td className="px-6 py-4 text-center text-slate-500">
                        {row.status === 'Ready' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Ready</span>
                        ) : row.status.startsWith('Warning') ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800 max-w-xs text-left">
                            {row.status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-800 max-w-xs text-left">
                            {row.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Dialog>
                          <DialogTrigger className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                            row.status === 'Ready'
                              ? 'text-slate-700 bg-white border-slate-200 hover:bg-slate-50'
                              : row.status.startsWith('Warning')
                              ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                              : 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100'
                          }`}>
                            <Eye className="w-3.5 h-3.5" />
                            {row.status === 'Ready' ? 'Details' : 'View Issue'}
                          </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Calculation Breakdown - {row.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6 py-4">
                                {/* Diagnostic block — always shown */}
                                {row.diagnostic && (
                                  <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 border border-slate-100">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Calculation Inputs</p>
                                    {[
                                      ['Salary Basis', row.diagnostic.salary_basis],
                                      ['Rate', row.diagnostic.rate],
                                      ['Pay Frequency', row.diagnostic.pay_frequency],
                                      ['Work Policy', row.diagnostic.work_policy],
                                      ['Approved Regular Hrs', row.diagnostic.approved_reg_hrs],
                                      ['Approved OT Hrs', row.diagnostic.approved_ot_hrs],
                                      ['Approved UT Hrs', row.diagnostic.approved_ut_hrs],
                                    ].map(([label, value]) => (
                                      <div key={label as string} className="flex justify-between text-xs">
                                        <span className="text-slate-500">{label}</span>
                                        <span className="font-medium text-slate-800">{String(value)}</span>
                                      </div>
                                      ))}
                                      {row.diagnostic.error_context && (
                                        <>
                                          <div className="flex justify-between text-xs mt-2 pt-2 border-t border-slate-200">
                                            <span className="text-red-500 font-semibold">Error Context</span>
                                            <span className="font-medium text-slate-800 text-right">{row.diagnostic.error_context}</span>
                                          </div>
                                          <div className="flex justify-between text-xs mt-1">
                                            <span className="text-amber-600 font-semibold">Resolution</span>
                                            <span className="font-medium text-slate-800 text-right">{row.diagnostic.resolution}</span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  )}
                                {/* Error/Warning message */}
                                {row.status !== 'Ready' && (
                                  <div className={`rounded-lg p-3 text-sm ${
                                    row.status.startsWith('Warning')
                                      ? 'bg-amber-50 border border-amber-200 text-amber-800'
                                      : 'bg-red-50 border border-red-200 text-red-800'
                                  }`}>
                                    <p className="font-semibold mb-1">
                                      {row.status.startsWith('Warning') ? '⚠ Warning' : '✗ Cannot Calculate Payroll'}
                                    </p>
                                    <p className="text-xs">{row.status.replace(/^(Error|Warning): ?/, '')}</p>
                                    {row.status.startsWith('Error') && (
                                      <a
                                        href={`/employees/${row.employee_id}?tab=compensation`}
                                        className="inline-block mt-2 text-xs font-semibold text-red-700 underline hover:no-underline"
                                      >
                                        Fix Compensation →
                                      </a>
                                    )}
                                  </div>
                                )}
                                {row.status === 'Ready' && (
                                  <>
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
                                  </>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-12">
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Gross</p>
                <p className="text-lg font-bold text-slate-900">₱{preview.reduce((s, r) => s + r.gross_pay, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Deductions</p>
                <p className="text-lg font-bold text-red-600">-₱{preview.reduce((s, r) => s + r.total_deductions, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Net Pay</p>
                <p className="text-lg font-bold text-emerald-600">₱{preview.reduce((s, r) => s + r.net_pay, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
            </div>
          </Card>

          {/* Submit buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => handleSubmit('Draft')}
              disabled={loading || hasErrors}
              className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit('Pending Approval')}
              disabled={loading || !allReady}
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit for Approval
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
