"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Ban, Undo2 } from "lucide-react"
import { togglePayrollItemExclusion } from "./actions"

export default function PayrollItemExclusionAction({ 
  itemId, 
  runId, 
  status, 
  isExcluded 
}: { 
  itemId: string; 
  runId: string; 
  status: string; 
  isExcluded: boolean;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  // Only allow excluding/including if status is Draft
  if (status !== 'Draft') {
    return null;
  }

  const handleToggle = async () => {
    if (!isExcluded && !reason.trim()) return;
    
    setLoading(true)
    await togglePayrollItemExclusion(itemId, runId, !isExcluded, reason)
    setLoading(false)
    setIsDialogOpen(false)
    setReason("")
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isExcluded ? (
            <DropdownMenuItem onClick={handleToggle} className="text-emerald-600 cursor-pointer">
              <Undo2 className="mr-2 h-4 w-4" />
              <span>Include in Run</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setIsDialogOpen(true)} className="text-orange-600 cursor-pointer">
              <Ban className="mr-2 h-4 w-4" />
              <span>Exclude from Run</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exclude Employee From Payroll</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-500 mb-4">
              This will remove the employee's calculation from the totals and reports, but will preserve the calculated line items in case you need to re-include them before approval.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Exclusion</label>
              <Input 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                placeholder="e.g. Resigned, Deferred pay, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>Cancel</Button>
            <Button variant="default" onClick={handleToggle} disabled={!reason.trim() || loading}>
              Confirm Exclusion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
