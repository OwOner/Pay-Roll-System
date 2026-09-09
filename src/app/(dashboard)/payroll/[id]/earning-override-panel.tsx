"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Edit3, RotateCcw, Loader2, AlertTriangle } from "lucide-react"
import { overridePayrollEarning, revertPayrollEarningOverride } from "./override-actions"
import { useRouter } from "next/navigation"

interface PayrollEarning {
  id: string
  description: string
  amount: number
  calculated_amount: number | null
  override_reason: string | null
  override_by: string | null
  override_at: string | null
  is_taxable: boolean
  source: string | null
}

interface EarningOverridePanelProps {
  earning: PayrollEarning
  payrollRunId: string
  /** If true, the payroll run is in a locked/approved state and overrides are not allowed */
  isLocked?: boolean
}

export function EarningOverridePanel({
  earning,
  payrollRunId,
  isLocked = false,
}: EarningOverridePanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showOverrideDialog, setShowOverrideDialog] = useState(false)
  const [showRevertDialog, setShowRevertDialog] = useState(false)
  const [newAmount, setNewAmount] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)

  const isOverridden = earning.calculated_amount !== null

  const handleOverride = () => {
    setNewAmount(String(Number(earning.amount).toFixed(2)))
    setReason(earning.override_reason || "")
    setError(null)
    setShowOverrideDialog(true)
  }

  const handleSubmitOverride = () => {
    setError(null)
    const amount = parseFloat(newAmount)
    if (isNaN(amount) || amount < 0) {
      setError("Please enter a valid non-negative amount.")
      return
    }
    if (!reason.trim()) {
      setError("Override reason is required.")
      return
    }

    startTransition(async () => {
      const result = await overridePayrollEarning(earning.id, amount, reason.trim(), payrollRunId)
      if (result.success) {
        setShowOverrideDialog(false)
        router.refresh()
      } else {
        setError(result.error || "Failed to save override.")
      }
    })
  }

  const handleRevert = () => {
    startTransition(async () => {
      const result = await revertPayrollEarningOverride(earning.id, payrollRunId)
      if (result.success) {
        setShowRevertDialog(false)
        router.refresh()
      } else {
        alert("Failed to revert: " + result.error)
      }
    })
  }

  return (
    <>
      <div className="flex items-center justify-between text-sm">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 truncate">{earning.description}</span>
            {isOverridden && (
              <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50 shrink-0">
                Overridden
              </Badge>
            )}
          </div>
          {isOverridden && earning.calculated_amount !== null && (
            <div className="text-xs text-muted-foreground mt-0.5">
              <span className="line-through text-slate-400">
                ₱{Number(earning.calculated_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              {earning.override_reason && (
                <span className="ml-2 italic">&ldquo;{earning.override_reason}&rdquo;</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <span className={`font-medium ${isOverridden ? "text-amber-700" : "text-slate-900"}`}>
            ₱{Number(earning.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          {!isLocked && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title="Override amount"
                onClick={handleOverride}
              >
                <Edit3 className="h-3 w-3" />
              </Button>
              {isOverridden && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground"
                  title="Revert to calculated amount"
                  onClick={() => setShowRevertDialog(true)}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Override Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={(open: boolean) => !open && setShowOverrideDialog(false)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Override: {earning.description}</DialogTitle>
            <DialogDescription>
              Enter the authorized final amount. The original calculated amount will be preserved for
              audit purposes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {isOverridden && earning.calculated_amount !== null && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md border text-sm">
                <span className="text-muted-foreground">Calculated Amount</span>
                <span className="font-medium text-slate-600 line-through">
                  ₱{Number(earning.calculated_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="override-amount">Override Amount (₱)</Label>
              <Input
                id="override-amount"
                type="number"
                step="0.01"
                min="0"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="override-reason">
                Override Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="override-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Approved by manager per memo #2026-09"
                rows={3}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOverrideDialog(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmitOverride} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Override"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revert Confirmation Dialog */}
      <Dialog open={showRevertDialog} onOpenChange={(open: boolean) => !open && setShowRevertDialog(false)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Revert Override?</DialogTitle>
            <DialogDescription>
              This will restore <strong>{earning.description}</strong> back to its calculated amount
              of{" "}
              <strong>
                ₱{Number(earning.calculated_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
              . The override and its reason will be cleared.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowRevertDialog(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleRevert} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reverting...
                </>
              ) : (
                "Revert to Calculated"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
