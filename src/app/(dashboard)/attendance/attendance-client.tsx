"use client"

import { useState, useEffect } from "react"
import { format, eachDayOfInterval, parseISO, isSameDay, subDays } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, LayoutGrid, List, Search, Upload, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { fetchAttendanceMatrix } from "./actions"
import AttendanceDetailDrawer from "./attendance-detail-drawer"

type ViewMode = 'grid' | 'list'

interface AttendanceClientProps {
  initialStartDate: string
  initialEndDate: string
}

export default function AttendanceClient({ initialStartDate, initialEndDate }: AttendanceClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)
  
  const [searchQuery, setSearchQuery] = useState("")
  
  const [employees, setEmployees] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedRecord, setSelectedRecord] = useState<{emp: any, date: string, record: any | null} | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    const { employees: emps, records: recs } = await fetchAttendanceMatrix(startDate, endDate)
    setEmployees(emps)
    setRecords(recs)
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [startDate, endDate])

  const filteredEmployees = employees.filter(e => 
    `${e.first_name} ${e.last_name} ${e.employee_code}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Compute days in interval
  const days: Date[] = []
  try {
    days.push(...eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) }))
  } catch (e) {
    // invalid dates
  }

  // Summary statistics
  const activeDaysCount = days.length * filteredEmployees.length
  const presentCount = records.filter(r => r.status === 'Present').length
  const absentCount = records.filter(r => r.status === 'Absent').length
  const leaveCount = records.filter(r => r.status === 'Leave').length
  const missingCount = activeDaysCount - records.length
  const otHours = records.reduce((sum, r) => sum + Number(r.overtime_hours || 0), 0)

  const handleCellClick = (emp: any, dateObj: Date) => {
    const dateStr = format(dateObj, 'yyyy-MM-dd')
    const existingRecord = records.find(r => r.employee_id === emp.id && r.work_date === dateStr)
    setSelectedRecord({ emp, date: dateStr, record: existingRecord || null })
    setDrawerOpen(true)
  }

  const getStatusDisplay = (record: any | undefined) => {
    if (!record) return { label: "?", color: "text-orange-500", title: "Missing Record" }
    switch (record.status) {
      case 'Present': return { label: "✓", color: "text-green-600", title: "Present" }
      case 'Absent': return { label: "A", color: "text-red-500", title: "Absent" }
      case 'Leave': return { label: "L", color: "text-blue-500", title: "Leave" }
      case 'Rest Day': return { label: "—", color: "text-muted-foreground", title: "Rest Day" }
      default: return { label: record.status.charAt(0), color: "text-gray-900", title: record.status }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance & Work Records</h2>
          <p className="text-sm text-muted-foreground">
            A unified view of employee work records from all sources.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/attendance/import">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import Attendance
            </Button>
          </Link>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{filteredEmployees.length}</div><div className="text-xs text-muted-foreground">Employees</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-green-600">{presentCount}</div><div className="text-xs text-muted-foreground">Present Days</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-red-500">{absentCount}</div><div className="text-xs text-muted-foreground">Absent Days</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-blue-500">{leaveCount}</div><div className="text-xs text-muted-foreground">Leave Days</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{otHours.toFixed(1)}</div><div className="text-xs text-muted-foreground">OT Hours</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-orange-500">{missingCount > 0 ? missingCount : 0}</div><div className="text-xs text-muted-foreground">Missing Records</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employee..."
                  className="pl-8 w-[200px]"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2 bg-muted p-1 rounded-md">
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-[140px] h-8 text-sm" />
                <span className="text-muted-foreground">to</span>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-[140px] h-8 text-sm" />
              </div>
            </div>
            
            <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
              <Button variant={viewMode === 'grid' ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode('grid')}>
                <LayoutGrid className="h-4 w-4 mr-2" /> Grid
              </Button>
              <Button variant={viewMode === 'list' ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode('list')}>
                <List className="h-4 w-4 mr-2" /> List
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 overflow-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading attendance data...</div>
          ) : viewMode === 'grid' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] sticky left-0 bg-background border-r">Employee</TableHead>
                  {days.map(d => (
                    <TableHead key={d.toISOString()} className="text-center min-w-[60px] px-1">
                      <div className="text-xs font-normal text-muted-foreground">{format(d, 'EEE')}</div>
                      <div>{format(d, 'd')}</div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell className="sticky left-0 bg-background border-r font-medium text-xs">
                      {emp.last_name}, {emp.first_name}
                    </TableCell>
                    {days.map(d => {
                      const dateStr = format(d, 'yyyy-MM-dd')
                      const record = records.find(r => r.employee_id === emp.id && r.work_date === dateStr)
                      const display = getStatusDisplay(record)
                      return (
                        <TableCell 
                          key={dateStr} 
                          className="text-center cursor-pointer hover:bg-muted/50 p-1"
                          onClick={() => handleCellClick(emp, d)}
                          title={display.title}
                        >
                          <span className={`font-bold text-sm ${display.color}`}>{display.label}</span>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
                {filteredEmployees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={days.length + 1} className="text-center py-8">No employees found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time In</TableHead>
                  <TableHead>Time Out</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.filter(r => filteredEmployees.some(e => e.id === r.employee_id)).map(r => {
                  const emp = employees.find(e => e.id === r.employee_id)
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{r.work_date}</TableCell>
                      <TableCell className="font-medium">{emp?.last_name}, {emp?.first_name}</TableCell>
                      <TableCell>
                         <Badge variant="outline">{r.status}</Badge>
                      </TableCell>
                      <TableCell>{r.time_in ? new Date(r.time_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</TableCell>
                      <TableCell>{r.time_out ? new Date(r.time_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</TableCell>
                      <TableCell>{r.projects?.project_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">{r.last_modified_source || r.source}</Badge>
                      </TableCell>
                      <TableCell>
                         <Button variant="ghost" size="sm" onClick={() => handleCellClick(emp, parseISO(r.work_date))}>Edit</Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {records.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">No records found for this period.</TableCell>
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
