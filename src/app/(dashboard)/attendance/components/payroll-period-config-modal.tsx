import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getActiveSchedules } from "../timesheet-actions"

interface PayrollPeriodConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payFrequency: string
  periodStart: string
  periodEnd: string
  existingConfig?: {
    statutory_schedule_id: string
    period_sequence: number
    contribution_month: string
  }
  onSave: (config: {
    statutory_schedule_id: string
    period_sequence: number
    contribution_month: string
  }) => Promise<void>
}

export default function PayrollPeriodConfigModal({
  open,
  onOpenChange,
  payFrequency,
  periodStart,
  periodEnd,
  existingConfig,
  onSave
}: PayrollPeriodConfigModalProps) {
  const [schedules, setSchedules] = useState<any[]>([])
  const [scheduleId, setScheduleId] = useState("")
  const [sequence, setSequence] = useState<number>(1)
  const [month, setMonth] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      getActiveSchedules(payFrequency).then(res => {
        setSchedules(res)
        if (existingConfig) {
          setScheduleId(existingConfig.statutory_schedule_id)
          setSequence(existingConfig.period_sequence)
          // HTML input type="month" expects "YYYY-MM"
          const cm = existingConfig.contribution_month
          if (cm) setMonth(cm.substring(0, 7))
        } else {
          // Defaults if no config
          setScheduleId(res.length > 0 ? res[0].id : "")
          setSequence(1)
          setMonth("")
        }
      })
    }
  }, [open, payFrequency, existingConfig])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!scheduleId) {
      setError("Please select a statutory schedule.")
      return
    }
    if (!month) {
      setError("Please select a contribution month.")
      return
    }
    if (sequence < 1) {
      setError("Sequence must be at least 1.")
      return
    }

    setLoading(true)
    try {
      // contribution_month should be stored as the first day of that month
      // month input is "YYYY-MM" -> append "-01"
      const contributionDate = `${month}-01`
      await onSave({
        statutory_schedule_id: scheduleId,
        period_sequence: sequence,
        contribution_month: contributionDate
      })
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Failed to save configuration.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Payroll Period</DialogTitle>
          <DialogDescription>
            {periodStart} to {periodEnd} ({payFrequency})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-6 pt-2">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Statutory Schedule</Label>
            <Select value={scheduleId} onValueChange={(v) => { if(v) setScheduleId(v) }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a schedule" />
              </SelectTrigger>
              <SelectContent>
                {schedules.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {schedules.length === 0 && (
              <p className="text-xs text-red-500">No active schedules found for {payFrequency}. Please configure one in Settings.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Period Sequence</Label>
            <Input 
              type="number" 
              min={1} 
              value={sequence} 
              onChange={e => setSequence(parseInt(e.target.value) || 1)} 
              required 
            />
            <p className="text-xs text-muted-foreground">The cutoff number (e.g. 1 for first half, 2 for second half).</p>
          </div>

          <div className="space-y-2">
            <Label>Contribution Month</Label>
            <Input 
              type="month" 
              value={month} 
              onChange={e => setMonth(e.target.value)} 
              required 
            />
            <p className="text-xs text-muted-foreground">The explicit statutory month this payroll contributes to.</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || schedules.length === 0}>
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
