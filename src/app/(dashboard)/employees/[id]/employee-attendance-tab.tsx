"use client"

import { useState, useEffect } from "react"
import { format, subDays, parseISO } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, Loader2 } from "lucide-react"
import AttendanceDetailDrawer from "@/app/(dashboard)/attendance/attendance-detail-drawer"
import { fetchEmployeeAttendance } from "./actions"

interface EmployeeAttendanceTabProps {
  employee: any
}

export function EmployeeAttendanceTab({ employee }: EmployeeAttendanceTabProps) {
  const [records, setRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // By default, show the last 30 days
  const [startDate] = useState(() => format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [endDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  const [selectedRecord, setSelectedRecord] = useState<{emp: any, date: string, record: any | null} | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    const recs = await fetchEmployeeAttendance(employee.id, startDate, endDate)
    setRecords(recs)
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [employee.id, startDate, endDate])

  const handleEditRecord = (record: any) => {
    setSelectedRecord({
      emp: employee,
      date: record.work_date,
      record: record
    })
    setDrawerOpen(true)
  }

  const handleAddRecord = () => {
    // Default to today for a new record
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    setSelectedRecord({
      emp: employee,
      date: todayStr,
      record: null
    })
    setDrawerOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'Absent': return 'bg-red-100 text-red-800 border-red-200'
      case 'Leave': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Rest Day': return 'bg-slate-100 text-slate-600 border-slate-200'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              Recent Attendance
            </CardTitle>
            <CardDescription className="mt-1">Last 30 days of attendance records.</CardDescription>
          </div>
          <Button onClick={handleAddRecord} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Record
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 flex justify-center items-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading records...
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="pl-6">Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time In</TableHead>
                  <TableHead>Time Out</TableHead>
                  <TableHead>Regular</TableHead>
                  <TableHead>OT</TableHead>
                  <TableHead>UT</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length > 0 ? (
                  records.map((record) => (
                    <TableRow key={record.id} className="hover:bg-slate-50">
                      <TableCell className="pl-6 font-medium text-slate-900">
                        {new Date(record.work_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {record.time_in ? new Date(record.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {record.time_out ? new Date(record.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </TableCell>
                      <TableCell className="text-slate-600">{record.regular_hours || '-'}</TableCell>
                      <TableCell className="text-slate-600">{record.overtime_hours || '-'}</TableCell>
                      <TableCell className="text-slate-600">
                        {record.internal_notes && record.internal_notes.includes('Undertime: ') 
                           ? record.internal_notes.match(/Undertime: (\d+(\.\d+)?)/)?.[1] || '-' 
                           : '-'}
                      </TableCell>
                      <TableCell className="text-slate-600 truncate max-w-[150px]">
                        {record.projects?.project_name || '-'}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="sm" onClick={() => handleEditRecord(record)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                      <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                      No attendance records found for this period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {drawerOpen && selectedRecord && (
        <AttendanceDetailDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          emp={selectedRecord.emp}
          date={selectedRecord.date}
          record={selectedRecord.record}
          onSaved={loadData}
        />
      )}
    </div>
  )
}
