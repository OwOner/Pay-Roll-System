import { authorizeModule } from "@/lib/supabase/server"
import AttendanceClient from "./attendance-client"
import { fetchCurrentPayrollPeriod } from "./actions"

export default async function AttendancePage() {
  await authorizeModule('attendance')
  const { startDate, endDate } = await fetchCurrentPayrollPeriod()
  
  return (
    <AttendanceClient initialStartDate={startDate} initialEndDate={endDate} />
  )
}
