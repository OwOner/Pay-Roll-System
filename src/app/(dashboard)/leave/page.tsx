import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { LeaveActionButtons } from "./leave-action-buttons"

export default async function LeaveManagementPage() {
  const supabase = await createClient()
  
  const { data: leaves } = await supabase
    .from('leave_requests')
    .select(`
      *,
      employees(first_name, last_name, employee_code),
      leave_types(name)
    `)
    .order('start_date', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leave Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage employee leave requests, approvals, and balances.
          </p>
        </div>
        <Link href="/leave/apply">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            File a Leave
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Leave Requests</CardTitle>
          <CardDescription>Review and approve pending applications.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Total Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves && leaves.length > 0 ? (
                leaves.map((leave) => {
                  const emp = leave.employees
                  return (
                    <TableRow key={leave.id}>
                      <TableCell>
                        <div className="font-medium">{emp?.last_name}, {emp?.first_name}</div>
                        <div className="text-xs text-muted-foreground">{emp?.employee_code}</div>
                      </TableCell>
                      <TableCell>{(leave.leave_types as any)?.name}</TableCell>
                      <TableCell>
                        {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{leave.number_of_days}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            leave.status === 'Approved' ? 'default' : 
                            leave.status === 'Pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {leave.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {leave.status === 'Pending' ? (
                          <LeaveActionButtons leaveId={leave.id} />
                        ) : (
                          <Button variant="ghost" size="sm">View</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No leave requests found.
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
