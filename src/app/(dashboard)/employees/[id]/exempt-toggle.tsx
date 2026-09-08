"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { togglePayrollExemption } from "./actions"
import { useRouter } from "next/navigation"

export function ExemptToggle({ employeeId, initialExempt }: { employeeId: string, initialExempt: boolean }) {
  const [isExempt, setIsExempt] = useState(initialExempt)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleToggle(checked: boolean) {
    setLoading(true)
    setIsExempt(checked)
    await togglePayrollExemption(employeeId, checked)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center space-x-2">
      <Switch 
        checked={isExempt} 
        onCheckedChange={handleToggle} 
        disabled={loading}
      />
      <span className="text-sm font-medium text-slate-900">
        {isExempt ? "Exempt" : "Active"}
      </span>
      {loading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
    </div>
  )
}
