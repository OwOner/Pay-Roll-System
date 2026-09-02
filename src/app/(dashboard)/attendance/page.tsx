import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Upload, Download } from "lucide-react"
import { Input } from "@/components/ui/input"

export default async function AttendancePage() {
  const supabase = await createClient()
  
  // We'll fetch today's date for a default view
  const today = new Date().toISOString().split('T')[0]

  const { data: attendance } = await supabase
    .from('attendance')
    .select(`
      *,
      employees(first_name, last_name, employee_code)
    `)
    .eq('record_date', today)
    .order('time_in', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Daily Time Records</h2>
          <p className="text-sm text-muted-foreground">
            Monitor employee attendance, time in, and time out.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import Biometrics
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-[300px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search employee..."
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Input type="date" defaultValue={today} className="w-[150px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time In</TableHead>
                <TableHead>Time Out</TableHead>
                <TableHead>Hours Worked</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance && attendance.length > 0 ? (
                attendance.map((record) => {
                  const emp = record.employees
                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="font-medium">{emp?.last_name}, {emp?.first_name}</div>
                        <div className="text-xs text-muted-foreground">{emp?.employee_code}</div>
                      </TableCell>
                      <TableCell>{new Date(record.record_date).toLocaleDateString()}</TableCell>
                      <TableCell>{record.time_in ? new Date(record.time_in).toLocaleTimeString() : '-'}</TableCell>
                      <TableCell>{record.time_out ? new Date(record.time_out).toLocaleTimeString() : '-'}</TableCell>
                      <TableCell>{record.regular_hours_worked || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={record.status === 'Present' ? 'default' : record.status === 'Late' ? 'secondary' : 'destructive'}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No attendance records found for this date.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
