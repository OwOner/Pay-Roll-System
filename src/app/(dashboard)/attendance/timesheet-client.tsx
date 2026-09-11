"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle2, Play, Settings2, Trash2 } from "lucide-react"
import { fetchTimesheets, generateTimesheets, approveAllTimesheets, getOrCreatePayrollPeriod } from "./timesheet-actions"
import TimesheetDetailDrawer from "./timesheet-detail-drawer"

export default function TimesheetClient({ initialStartDate, initialEndDate }: { initialStartDate?: string, initialEndDate?: string }) {
  const [startDate, setStartDate] = useState(initialStartDate || "2026-09-01")
  const [endDate, setEndDate] = useState(initialEndDate || "2026-09-15")
  const [frequency, setFrequency] = useState("Weekly")
  
  const [timesheets, setTimesheets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [periodId, setPeriodId] = useState<string | null>(null)
  
  const [selectedTimesheet, setSelectedTimesheet] = useState<any>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const period = await getOrCreatePayrollPeriod(startDate, endDate, frequency)
      setPeriodId(period.id)
      const res = await fetchTimesheets(period.id)
      if (res.success) {
        setTimesheets(res.timesheets ?? [])
      }
    } catch (e) {
      console.error(e)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [startDate, endDate, frequency])

  const handleGenerate = async () => {
    if (!periodId) return
    setIsLoading(true)
    const res = await generateTimesheets(periodId)
    if (res && res.message) alert(res.message)
    await loadData()
  }

  const handleApproveAll = async () => {
    if (!periodId) return
    setIsLoading(true)
    const res = await approveAllTimesheets(periodId)
    if (res && res.message) alert(res.message)
    if (res && res.error) alert("Error: " + res.error)
    await loadData()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-[140px]" />
            <span className="text-muted-foreground">to</span>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-[140px]" />
            <Select value={frequency} onValueChange={(v, _) => { if (v !== null) setFrequency(v) }}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Semi-Monthly">Semi-Monthly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadData} variant="secondary">Load</Button>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleGenerate} variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">
              <Play className="h-4 w-4 mr-2" /> Generate Timesheets
            </Button>
            <Button onClick={handleApproveAll} variant="default" className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-2" /> Approve All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Regular</TableHead>
                <TableHead className="text-right">OT</TableHead>
                <TableHead className="text-right">Absent (Days)</TableHead>
                <TableHead className="text-right">Missing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timesheets.map(ts => (
                <TableRow key={ts.id}>
                  <TableCell className="font-medium">{ts.employees?.last_name}, {ts.employees?.first_name}</TableCell>
                  <TableCell className="text-right">{ts.overridden_total_regular_hours ?? ts.total_regular_hours ?? 0}h</TableCell>
                  <TableCell className="text-right">{ts.overridden_total_overtime_hours ?? ts.total_recorded_ot_hours ?? 0}h</TableCell>
                  <TableCell className="text-right text-red-600 font-semibold">{ts.overridden_absent_days ?? ts.absent_days ?? 0}</TableCell>
                  <TableCell className="text-right text-orange-600">{ts.missing_records_count}</TableCell>
                  <TableCell>
                    {ts.status === 'Approved' ? (
                      <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">Approved</Badge>
                    ) : ts.status === 'Reopened' ? (
                      <Badge variant="outline" className="border-orange-500 text-orange-700 bg-orange-50">Reopened</Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">Draft</Badge>
                    )}
                    {ts.is_stale && <Badge variant="destructive" className="ml-2">Stale</Badge>}
                    {ts.missing_records_count > 0 && <Badge variant="outline" className="ml-2 border-orange-500 text-orange-700 bg-orange-50" title="Missing days will be treated as 0 hours for payroll">Missing: {ts.missing_records_count}</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedTimesheet(ts); setDrawerOpen(true); }}>
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {timesheets.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No timesheets generated for this period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {drawerOpen && selectedTimesheet && (
        <TimesheetDetailDrawer 
          open={drawerOpen} 
          onOpenChange={setDrawerOpen} 
          timesheet={selectedTimesheet} 
          onSaved={loadData} 
        />
      )}
    </div>
  )
}
