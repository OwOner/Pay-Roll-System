"use client"

import { useState } from "react"
import { approvePayrollRun, rejectPayrollRun, markPayrollPaid, submitDraftForApproval, deleteDraft } from "./actions"
import { Loader2, Check, X, Banknote, Send, Trash, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function PayrollActions({ runId, status }: { runId: string, status: string }) {
  const [loading, setLoading] = useState(false)
  const [showReject, setShowReject] = useState(false)
  
  async function handleApprove() {
    setLoading(true)
    await approvePayrollRun(runId)
    setLoading(false)
  }

  async function handleReject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const data = new FormData(e.currentTarget)
    await rejectPayrollRun(runId, data.get('reason') as string)
    setLoading(false)
    setShowReject(false)
  }

  async function handlePaid() {
    setLoading(true)
    await markPayrollPaid(runId)
    setLoading(false)
  }

  if (status === 'Approved') {
    return (
      <div className="flex gap-3">
        <Link
          href={`/payroll/${runId}/payslips`}
          target="_blank"
          className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
        >
          <FileText className="w-4 h-4" />
          Print Payslips
        </Link>
        <button
          onClick={handlePaid}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
          Mark as Paid
        </button>
      </div>
    )
  }

  if (status === 'Paid') {
    return (
      <Link
        href={`/payroll/${runId}/payslips`}
        target="_blank"
        className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
      >
        <FileText className="w-4 h-4" />
        Print Payslips
      </Link>
    )
  }

  const router = useRouter()

  if (status === 'Draft') {
    return (
      <div className="flex gap-3">
        <button
          onClick={async () => {
            setLoading(true)
            const result = await deleteDraft(runId)
            if (result?.error) {
              alert("Error deleting draft: " + result.error)
              setLoading(false)
            } else {
              window.location.href = '/payroll'
            }
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4" />}
          Delete Draft
        </button>
        <button
          onClick={async () => {
            setLoading(true)
            const result = await submitDraftForApproval(runId)
            if (result.error) {
              alert("Error submitting for approval: " + result.error)
            }
            setLoading(false)
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Submit for Approval
        </button>
      </div>
    )
  }

  if (status !== 'Pending Approval') {
    return null // Buttons hidden if Paid or Rejected
  }

  if (showReject) {
    return (
      <form onSubmit={handleReject} className="flex items-center gap-2">
        <input 
          type="text" 
          name="reason" 
          required 
          placeholder="Reason for rejection..." 
          className="p-2 text-sm border border-slate-200 rounded-lg"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "..." : "Confirm Reject"}
        </button>
        <button
          type="button"
          onClick={() => setShowReject(false)}
          className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200"
        >
          Cancel
        </button>
      </form>
    )
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => setShowReject(true)}
        className="inline-flex items-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors"
      >
        <X className="w-4 h-4" /> Reject
      </button>
      <button
        onClick={handleApprove}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 shadow-sm"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Approve & Lock
      </button>
    </div>
  )
}
