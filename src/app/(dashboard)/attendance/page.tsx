import { authorizeModule } from "@/lib/supabase/server"
import AttendanceClient from "./attendance-client"
import TimesheetClient from "./timesheet-client"
import { fetchCurrentPayrollPeriod } from "./actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function AttendancePage() {
  await authorizeModule('attendance')
  const { startDate, endDate } = await fetchCurrentPayrollPeriod()
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Attendance & Timesheets</h2>
        <p className="text-sm text-muted-foreground">
          Manage daily attendance records and aggregate timesheets for payroll.
        </p>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="daily">Daily Records</TabsTrigger>
          <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
          <AttendanceClient initialStartDate={startDate} initialEndDate={endDate} />
        </TabsContent>
        <TabsContent value="timesheets">
          <TimesheetClient />
        </TabsContent>
      </Tabs>
    </div>
  )
}
