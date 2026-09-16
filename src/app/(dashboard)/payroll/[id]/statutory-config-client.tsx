"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { setStatutoryConfigurationStatus } from "./actions"
import { getActiveSchedules, updatePayrollPeriodConfig } from "../../attendance/timesheet-actions"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function StatutoryConfigClient({ 
  periodId,
  frequency,
  periodStart,
  periodEnd
}: {
  periodId: string,
  frequency: string,
  periodStart: string,
  periodEnd: string
}) {
  const [skipModalOpen, setSkipModalOpen] = useState(false)
  const [setupModalOpen, setSetupModalOpen] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [skipReason, setSkipReason] = useState("")
  const router = useRouter()

  const handleSkip = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await setStatutoryConfigurationStatus(periodId, 'Intentionally Skipped', skipReason)
    if (!res.success) {
      alert(res.error)
      setLoading(false)
      return
    }
    setSkipModalOpen(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button 
        onClick={() => setSetupModalOpen(true)}
        className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
      >
        Set Up Deductions
      </Button>
      <Button 
        variant="outline" 
        onClick={() => setSkipModalOpen(true)}
        className="border-orange-200 text-orange-700 hover:bg-orange-100"
      >
        I understand and want to continue without deductions
      </Button>

      {/* Skip Confirmation Modal */}
      <Dialog open={skipModalOpen} onOpenChange={setSkipModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-slate-600">
              This payroll contains employees who are configured for statutory deductions. 
              Continuing without deductions may result in an incomplete payroll.
            </p>
            <p className="text-slate-600 font-medium">
              This decision will be recorded in the payroll audit history.
            </p>
            <form onSubmit={handleSkip} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Reason: [ required ]</label>
                <Input 
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  placeholder="Why are deductions skipped for this run?"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setSkipModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Confirm & Continue
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {setupModalOpen && (
        <PeriodSetupModal 
          open={setupModalOpen}
          onOpenChange={setSetupModalOpen}
          periodId={periodId}
          frequency={frequency}
          periodEnd={periodEnd}
          onSuccess={() => {
            setSetupModalOpen(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

function PeriodSetupModal({ 
  open, 
  onOpenChange, 
  periodId,
  frequency,
  periodEnd,
  onSuccess
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  periodId: string,
  frequency: string,
  periodEnd: string,
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [schedules, setSchedules] = useState<any[]>([])
  
  // Suggest a contribution month (the 1st of the month the period ends in)
  const d = new Date(periodEnd)
  const suggestedMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  
  const [month, setMonth] = useState(suggestedMonth)
  const [scheduleId, setScheduleId] = useState("")
  const [sequence, setSequence] = useState("1")

  // Load schedules lazily
  useEffect(() => {
    getActiveSchedules(frequency)
      .then(d => {
        if (d) setSchedules(d)
      })
      .catch(console.error)
  }, [frequency])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // update the payroll_period configuration
    const res = await updatePayrollPeriodConfig(periodId, {
      statutory_schedule_id: scheduleId,
      contribution_month: month,
      period_sequence: parseInt(sequence)
    })
    
    if (!res.success) {
      alert(res.error)
      setLoading(false)
      return
    }

    // Mark as Configured
    const statusRes = await setStatutoryConfigurationStatus(periodId, 'Configured')
    if (!statusRes.success) {
      alert(statusRes.error)
    }

    onSuccess()
  }

  // Helper to render sequences human-readable
  const renderSequences = () => {
    if (frequency === 'Weekly') {
      return [1,2,3,4,5].map(v => <SelectItem key={v} value={v.toString()}>Week {v}</SelectItem>)
    }
    if (frequency === 'Semi-Monthly') {
      return [1,2].map(v => <SelectItem key={v} value={v.toString()}>{v === 1 ? '1st Half' : '2nd Half'}</SelectItem>)
    }
    return <SelectItem value="1">Main Payroll</SelectItem>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Payroll Deductions</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Which month should this payroll count toward?</label>
            <p className="text-xs text-slate-500 mb-2">Based on this payroll period, we suggest {new Date(suggestedMonth).toLocaleDateString(undefined, { month: 'long', year: 'numeric'})}.</p>
            <Input 
              type="date" 
              value={month} 
              onChange={e => setMonth(e.target.value)} 
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Which payroll in this cycle is this?</label>
            <Select value={sequence} onValueChange={(v) => { if(v) setSequence(v) }} required>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {renderSequences()}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Select Statutory Schedule</label>
            <Select value={scheduleId} onValueChange={(v) => { if(v) setScheduleId(v) }} required>
              <SelectTrigger><SelectValue placeholder="Select a schedule" /></SelectTrigger>
              <SelectContent>
                {schedules.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name || s.description}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {schedules.length === 0 && (
              <p className="text-sm text-red-500">No schedules found for {frequency}. Please create one in Settings.</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !scheduleId} className="bg-slate-900 hover:bg-slate-800 text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Configuration
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
