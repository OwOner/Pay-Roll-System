"use client"

import { useState } from "react"
import { approvePayrollRun, rejectPayrollRun, markPayrollPaid, submitDraftForApproval, deleteDraft } from "./actions"
import { Loader2, Check, X, Banknote, Send, Trash, FileText, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

import { getPayrollDiagnostics } from "./reconciliation-actions"

export default function PayrollActions({ runId, status }: { runId: string, status: string }) {
  const [loading, setLoading] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [showOverride, setShowOverride] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  void router
  
  async function handleApproveAttempt() {
    setLoading(true)
    const diagnostics = await getPayrollDiagnostics(runId)
    setLoading(false)

    if (diagnostics.hasBlockingErrors) {
      toast({
        variant: "destructive",
        title: "Cannot approve payroll",
        description: "Blocking errors detected. Please review the Diagnostics tab."
      })
      return
    }

    if (diagnostics.warnings.length > 0) {
      setShowOverride(true)
      return
    }

    // Clean payroll
    setLoading(true)
    const result = await approvePayrollRun(runId)
    if (result.error) {
      toast({ variant: "destructive", title: "Error", description: result.error })
    } else {
      toast({ title: "Success", description: "Payroll run approved successfully." })
    }
    setLoading(false)
  }

  async function handleApproveWithOverride(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const data = new FormData(e.currentTarget)
    const result = await approvePayrollRun(runId, data.get('reason') as string)
    if (result.error) {
      toast({ variant: "destructive", title: "Error", description: result.error })
    } else {
      toast({ title: "Success", description: "Payroll run approved with overrides." })
    }
    setLoading(false)
    setShowOverride(false)
  }

  async function handleReject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const data = new FormData(e.currentTarget)
    await rejectPayrollRun(runId, data.get('reason') as string)
    setLoading(false)
    setShowReject(false)
  }

  const [showPaid, setShowPaid] = useState(false)

  async function handlePaid(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const data = new FormData(e.currentTarget)
    const ref = data.get('reference') as string
    await markPayrollPaid(runId, ref)
    setLoading(false)
    setShowPaid(false)
  }

  if (status === 'Approved') {
    if (showPaid) {
      return (
        <form onSubmit={handlePaid} className="flex items-center gap-2 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
          <input 
            type="text" 
            name="reference" 
            placeholder="Payment Reference (optional)" 
            className="p-2 text-sm border border-emerald-300 rounded-lg w-64"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "..." : "Confirm Payment"}
          </button>
          <button
            type="button"
            onClick={() => setShowPaid(false)}
            className="bg-white text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-100"
          >
            Cancel
          </button>
        </form>
      )
    }

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
        <a
          href={`/api/payroll/export?runId=${runId}`}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </a>
        <Link
          href={`/payroll/${runId}/confirmation`}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
        >
          <FileText className="w-4 h-4" />
          Confirmation Sheet
        </Link>
        <Link
          href={`/payroll/${runId}/signature-sheet`}
          target="_blank"
          className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
        >
          <FileText className="w-4 h-4" />
          Signature Sheet (Blank)
        </Link>
        <button
          onClick={() => setShowPaid(true)}
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
      <div className="flex gap-3">
        <Link
          href={`/payroll/${runId}/payslips`}
          target="_blank"
          className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
        >
          <FileText className="w-4 h-4" />
          Print Payslips
        </Link>
        <a
          href={`/api/payroll/export?runId=${runId}`}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </a>
        <Link
          href={`/payroll/${runId}/confirmation`}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
        >
          <FileText className="w-4 h-4" />
          Confirmation Sheet
        </Link>
        <Link
          href={`/payroll/${runId}/signature-sheet`}
          target="_blank"
          className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
        >
          <FileText className="w-4 h-4" />
          Signature Sheet (Blank)
        </Link>
      </div>
    )
  }


  if (status === 'Draft') {
    return (
      <div className="flex gap-3">
        <Link
          href={`/payroll/${runId}/confirmation`}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
        >
          <FileText className="w-4 h-4" />
          Confirmation Sheet
        </Link>
        <Link
          href={`/payroll/${runId}/signature-sheet`}
          target="_blank"
          className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
        >
          <FileText className="w-4 h-4" />
          Signature Sheet (Blank)
        </Link>
        <button
          onClick={async () => {
            setLoading(true)
            const result = await deleteDraft(runId)
            if (result?.error) {
              toast({ variant: "destructive", title: "Error deleting draft", description: result.error })
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
              toast({ variant: "destructive", title: "Error", description: result.error })
            } else {
              toast({ title: "Success", description: "Payroll submitted for approval." })
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

  if (showOverride) {
    return (
      <form onSubmit={handleApproveWithOverride} className="flex items-center gap-2">
        <input 
          type="text" 
          name="reason" 
          required 
          placeholder="Reason for overriding warnings..." 
          className="p-2 text-sm border border-orange-300 rounded-lg w-64"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? "..." : "Confirm Override"}
        </button>
        <button
          type="button"
          onClick={() => setShowOverride(false)}
          className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200"
        >
          Cancel
        </button>
      </form>
    )
  }

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
      <a
        href={`/api/payroll/export?runId=${runId}`}
        className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
      >
        <Download className="w-4 h-4" />
        Export CSV
      </a>
      <Link
        href={`/payroll/${runId}/confirmation`}
        className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
      >
        <FileText className="w-4 h-4" />
        Confirmation Sheet
      </Link>
      <Link
        href={`/payroll/${runId}/signature-sheet`}
        target="_blank"
        className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
      >
        <FileText className="w-4 h-4" />
        Signature Sheet (Blank)
      </Link>
      <button
        onClick={() => setShowReject(true)}
        className="inline-flex items-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors"
      >
        <X className="w-4 h-4" /> Reject
      </button>
      <button
        onClick={handleApproveAttempt}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 shadow-sm"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Approve & Lock
      </button>
    </div>
  )
}
