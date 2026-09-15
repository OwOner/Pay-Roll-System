import { createClient } from "@/lib/supabase/server"
import StatutoryScheduleClient from "./statutory-schedule-client"

export default async function StatutorySchedulesPage() {
  const supabase = await createClient()

  // Fetch all statutory schedules with their allocations
  const { data: schedules } = await supabase
    .from('company_statutory_schedules')
    .select(`
      *,
      allocations:statutory_schedule_allocations(*)
    `)
    .order('effective_from', { ascending: false })

  // Find schedules that are in use (have a finalized payroll run)
  const { data: usedSchedules } = await supabase
    .rpc('get_used_statutory_schedule_ids')

  // We can write an RPC or just do a manual query to find which schedules are used by finalized runs.
  // Actually, since RPC isn't built yet, we can query it directly in server:
  const { data: finalizedPeriods } = await supabase
    .from('payroll_periods')
    .select('statutory_schedule_id, payroll_runs!inner(status)')
    .in('payroll_runs.status', ['Calculated', 'For Review', 'Pending Approval', 'Approved', 'Paid'])
    .not('statutory_schedule_id', 'is', null)

  const usedScheduleIds = new Set(finalizedPeriods?.map(p => p.statutory_schedule_id))

  // Attach is_immutable flag to schedules
  const mappedSchedules = (schedules || []).map(s => ({
    ...s,
    is_immutable: usedScheduleIds.has(s.id)
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Statutory Schedules</h3>
          <p className="text-sm text-muted-foreground">
            Configure how statutory deductions are allocated across payroll cutoffs.
          </p>
        </div>
      </div>
      
      <StatutoryScheduleClient initialSchedules={mappedSchedules} />
    </div>
  )
}
