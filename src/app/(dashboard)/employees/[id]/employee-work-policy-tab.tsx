"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Briefcase, Plus, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function EmployeeWorkPolicyTab({ employee }: { employee: any }) {
  const policies = employee.employee_work_policies || []
  const positionPolicyId = employee.positions?.default_work_policy_id

  // We sort policies by effective_from descending
  const sortedPolicies = [...policies].sort((a, b) => 
    new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime()
  )

  const activePolicy = sortedPolicies.find(p => !p.effective_to || new Date(p.effective_to) >= new Date())

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-100">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-slate-400" />
            Work Policy History
          </CardTitle>
          <CardDescription className="mt-1">
            Employee-specific schedules and payroll rules.
          </CardDescription>
        </div>
        {/* Placeholder for Assign Policy Dialog */}
      </CardHeader>
      
      <CardContent className="pt-6">
        
        {!activePolicy && positionPolicyId && (
          <Alert className="mb-6 bg-slate-50 border-slate-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Using Default Policy</AlertTitle>
            <AlertDescription>
              This employee has no active specific policy, so the payroll engine will fallback to the default Work Policy defined by their Position: <strong>{employee.positions.title}</strong>.
            </AlertDescription>
          </Alert>
        )}

        {!activePolicy && !positionPolicyId && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Policy Assigned</AlertTitle>
            <AlertDescription>
              This employee has no active policy, and their Position does not define a default. The payroll engine will fall back to the Company default, or it may fail if no default exists.
            </AlertDescription>
          </Alert>
        )}

        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="pl-6">Effective Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Policy Name</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Rest Days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPolicies.length > 0 ? (
              sortedPolicies.map((p: any) => (
                <TableRow key={p.id} className="hover:bg-slate-50">
                  <TableCell className="pl-6 font-medium text-slate-900">
                    {new Date(p.effective_from).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {p.effective_to ? (
                      new Date(p.effective_to).toLocaleDateString()
                    ) : (
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200">Current</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">{p.work_policies?.name}</TableCell>
                  <TableCell>{p.work_policies?.scheduled_hours_per_day}h / {p.work_policies?.scheduled_days_per_week}d</TableCell>
                  <TableCell>{p.work_policies?.rest_days?.join(', ')}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                  <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                  No specific work policies recorded for this employee.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
