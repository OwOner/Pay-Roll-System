"use client"

import { useState } from "react"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { updateTimesheetOverrides, approveTimesheet, reopenTimesheet } from "./timesheet-actions"
import { CheckCircle2, Save, Undo2, AlertCircle } from "lucide-react"

export default function TimesheetDetailDrawer({
  open,
  onOpenChange,
  timesheet,
  onSaved
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  timesheet: any
  onSaved: () => void
}) {
  // We'll manage the day-by-day overrides locally before saving
  const [details, setDetails] = useState<any[]>(
    timesheet.timesheet_details ? [...timesheet.timesheet_details].sort((a, b) => a.date.localeCompare(b.date)) : []
  )
  const [reason, setReason] = useState(timesheet.override_reason || "")
  const [isSaving, setIsSaving] = useState(false)

  const isApproved = timesheet.status === 'Approved'

  const handleDetailChange = (index: number, field: string, value: number) => {
    const newDetails = [...details]
    newDetails[index] = { ...newDetails[index], [field]: value }
    setDetails(newDetails)
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    // We calculate new totals based on the modified details
    const total_payable_ot_hours = details.reduce((sum, d) => sum + Number(d.payable_ot_hours || 0), 0)
    const total_payable_ut_hours = details.reduce((sum, d) => sum + Number(d.payable_ut_hours || 0), 0)
    
    await updateTimesheetOverrides(timesheet.id, {
      total_payable_ot_hours,
      total_payable_ut_hours,
      timesheet_details_updates: details.map(d => ({
        id: d.id,
        payable_ot_hours: d.payable_ot_hours,
        payable_ut_hours: d.payable_ut_hours
      }))
    }, reason)
    
    onSaved()
    setIsSaving(false)
    onOpenChange(false)
  }

  const handleApprove = async () => {
    setIsSaving(true)
    const res = await approveTimesheet(timesheet.id)
    if (res && res.error) {
      alert("Error: " + res.error)
    } else {
      onSaved()
      onOpenChange(false)
    }
    setIsSaving(false)
  }

  const handleReopen = async () => {
    setIsSaving(true)
    const res = await reopenTimesheet(timesheet.id)
    if (res && res.error) {
      alert("Error: " + res.error)
    } else {
      onSaved()
      onOpenChange(false)
    }
    setIsSaving(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[700px] sm:max-w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Timesheet Approval & Overrides</SheetTitle>
          <SheetDescription>
            {timesheet.employees.first_name} {timesheet.employees.last_name} ({timesheet.period_start} to {timesheet.period_end})
          </SheetDescription>
        </SheetHeader>

        {timesheet.missing_records_count > 0 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="text-sm text-orange-800">
              <span className="font-semibold">{timesheet.missing_records_count} missing attendance records.</span> 
              <br/>These days will be treated as 0 hours for payroll unless manually corrected.
            </div>
          </div>
        )}
        
        <div className="py-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Status</Label>
              <div><Badge variant={isApproved ? 'default' : 'secondary'}>{timesheet.status}</Badge></div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Missing Records</Label>
              <div className="font-semibold text-orange-600">{timesheet.missing_records_count} days</div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm">Day-by-Day Breakdown</h4>
            
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Reg</TableHead>
                    <TableHead className="text-right">Rec OT</TableHead>
                    <TableHead className="text-right">App OT</TableHead>
                    <TableHead className="text-right">Rec UT</TableHead>
                    <TableHead className="text-right">App UT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.length > 0 ? details.map((d, i) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-xs whitespace-nowrap">
                        {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]" title={d.day_type}>
                        {d.day_type}
                      </TableCell>
                      <TableCell className="text-right text-xs">{d.regular_hours}</TableCell>
                      <TableCell className="text-right text-xs bg-slate-50/50">{d.recorded_ot_hours}</TableCell>
                      <TableCell className="text-right p-1">
                        {isApproved ? (
                          <span className="text-xs font-semibold px-2">{d.payable_ot_hours}</span>
                        ) : (
                          <Input 
                            type="number" 
                            step="0.5" 
                            className="h-7 w-16 text-right text-xs p-1 mx-auto" 
                            value={d.payable_ot_hours} 
                            onChange={e => handleDetailChange(i, 'payable_ot_hours', Number(e.target.value))} 
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs bg-slate-50/50">{d.recorded_ut_hours}</TableCell>
                      <TableCell className="text-right p-1">
                        {isApproved ? (
                          <span className="text-xs font-semibold px-2">{d.payable_ut_hours}</span>
                        ) : (
                          <Input 
                            type="number" 
                            step="0.5" 
                            className="h-7 w-16 text-right text-xs p-1 mx-auto" 
                            value={d.payable_ut_hours} 
                            onChange={e => handleDetailChange(i, 'payable_ut_hours', Number(e.target.value))} 
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-muted-foreground text-xs">No details found. Try regenerating timesheets.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {!isApproved && (
              <div className="space-y-4 pt-4 border-t mt-4">
                <div className="space-y-2 pt-2">
                  <Label>Reason for Override (Optional)</Label>
                  <Input 
                    value={reason} 
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. Adjusted OT for specific project"
                  />
                </div>
              </div>
            )}
            
            {isApproved && timesheet.override_reason && (
              <div className="text-sm border-t pt-2 mt-2">
                <span className="text-muted-foreground">Override Reason: </span>
                <span>{timesheet.override_reason}</span>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="flex-col sm:flex-row gap-2">
          {!isApproved && (
            <>
              <Button variant="outline" onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
                <Save className="mr-2 h-4 w-4" /> Save OT/UT Changes
              </Button>
              <Button onClick={handleApprove} disabled={isSaving || timesheet.missing_records_count > 0} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve Timesheet
              </Button>
            </>
          )}
          {isApproved && (
            <Button variant="outline" onClick={handleReopen} disabled={isSaving} className="w-full sm:w-auto text-orange-600 border-orange-200 hover:bg-orange-50">
              <Undo2 className="mr-2 h-4 w-4" /> Reopen Timesheet
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
