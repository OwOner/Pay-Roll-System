"use client"

import { useState, useEffect } from "react"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { updateAttendanceRecord } from "./actions"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"

interface AttendanceDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  emp: any
  date: string
  record: any | null
  onSaved: () => void
}

export default function AttendanceDetailDrawer({ open, onOpenChange, emp, date, record, onSaved }: AttendanceDetailDrawerProps) {
  const [status, setStatus] = useState(record?.status || "Present")
  const [timeIn, setTimeIn] = useState(record?.time_in ? format(new Date(record.time_in), 'HH:mm') : "")
  const [timeOut, setTimeOut] = useState(record?.time_out ? format(new Date(record.time_out), 'HH:mm') : "")
  const [projectId, setProjectId] = useState(record?.project_id || "")
  const [notes, setNotes] = useState(record?.internal_notes || "")
  const [reason, setReason] = useState("")
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    const fetchProjects = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('projects').select('id, project_name').eq('is_active', true)
      if (data) setProjects(data)
    }
    fetchProjects()
  }, [])

  // If time in/out changes, we should convert back to ISO strings combined with the work date
  const getIsoString = (timeStr: string) => {
    if (!timeStr) return null
    return new Date(`${date}T${timeStr}:00`).toISOString()
  }

  const handleSave = async () => {
    if (record && !reason.trim()) {
      alert("Please provide a reason for this manual correction.")
      return
    }

    setIsSubmitting(true)
    const payload = {
      employee_id: emp.id,
      work_date: date,
      status,
      time_in: getIsoString(timeIn),
      time_out: getIsoString(timeOut),
      project_id: projectId || null,
      internal_notes: notes
    }

    const res = await updateAttendanceRecord(record?.id || null, payload, reason)
    setIsSubmitting(false)

    if (res.success) {
      onSaved()
      onOpenChange(false)
    } else {
      alert("Failed to save: " + res.error)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Attendance Record</SheetTitle>
          <SheetDescription>
            {format(new Date(date), 'MMMM d, yyyy')} — {emp.first_name} {emp.last_name}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
             <div className="text-sm">
               <div className="text-muted-foreground mb-1">Source</div>
               <Badge variant="outline" className="font-mono">{record?.last_modified_source || record?.source || 'manual_entry'}</Badge>
             </div>
             {record?.last_modified_at && (
               <div className="text-sm text-right">
                 <div className="text-muted-foreground mb-1">Last Modified</div>
                 <div className="font-medium text-xs">{format(new Date(record.last_modified_at), 'MMM d, yyyy HH:mm')}</div>
               </div>
             )}
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="Leave">Leave</SelectItem>
                <SelectItem value="Rest Day">Rest Day</SelectItem>
                <SelectItem value="Half Day">Half Day</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Time In (Optional)</Label>
              <Input type="time" value={timeIn} onChange={e => setTimeIn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Time Out (Optional)</Label>
              <Input type="time" value={timeOut} onChange={e => setTimeOut(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Project / Site (Optional)</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- No Project --</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Only required for project-based workers.</p>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="E.g. Arrived late due to traffic" />
          </div>

          {record && (
            <div className="space-y-2 p-4 border border-destructive/20 bg-destructive/5 rounded-md mt-4">
              <Label className="text-destructive font-semibold">Reason for Correction</Label>
              <p className="text-xs text-muted-foreground mb-2">You are modifying an existing record. A reason is required for the audit trail.</p>
              <Input 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                placeholder="E.g. Employee forgot to scan" 
                className="border-destructive/30 focus-visible:ring-destructive/30"
              />
            </div>
          )}

        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSubmitting || (record && !reason.trim())}>
            {isSubmitting ? "Saving..." : "Save Record"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
