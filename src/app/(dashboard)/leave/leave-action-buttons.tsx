"use client"

import { Button } from "@/components/ui/button"
import { Check, X, Loader2 } from "lucide-react"
import { approveLeaveRequest, rejectLeaveRequest } from "./actions"
import { useState, useTransition } from "react"
import { useToast } from "@/hooks/use-toast"

export function LeaveActionButtons({ leaveId }: { leaveId: string }) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleApprove = () => {
    startTransition(async () => {
      const res = await approveLeaveRequest(leaveId)
      if (res.error) {
        toast({ title: "Error", description: res.error, variant: "destructive" })
      } else {
        toast({ title: "Approved", description: "Leave request approved." })
      }
    })
  }

  const handleReject = () => {
    startTransition(async () => {
      const res = await rejectLeaveRequest(leaveId)
      if (res.error) {
        toast({ title: "Error", description: res.error, variant: "destructive" })
      } else {
        toast({ title: "Rejected", description: "Leave request rejected." })
      }
    })
  }

  return (
    <div className="flex justify-end gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleApprove}
        disabled={isPending}
        className="text-green-600 border-green-600 hover:bg-green-50 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleReject}
        disabled={isPending}
        className="text-red-600 border-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
      </Button>
    </div>
  )
}
