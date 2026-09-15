import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { updateEmployee } from "./actions"
import { StatutoryProfileManager } from "./statutory-profile-manager"
import { EditEmployeeForm } from "./edit-employee-form"

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: employee, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()

  const { data: currentProfile } = await supabase
    .from('employee_statutory_profiles')
    .select('*')
    .eq('employee_id', id)
    .is('effective_to', null)
    .single()

  if (error || !employee) {
    return notFound()
  }

  const { data: departments } = await supabase.from('departments').select('id, name').eq('is_active', true).order('name')
  const { data: positions } = await supabase.from('positions').select('id, title, department_id').eq('is_active', true).order('title')

  // We bind the ID so the action knows which employee to update.
  // Next.js Server Actions with bind creates a new action function.
  const updateEmployeeWithId = updateEmployee.bind(null, id)

  // format date for date input
  const dateHired = employee.date_hired ? new Date(employee.date_hired).toISOString().split('T')[0] : ''

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Edit Employee</h2>
          <p className="text-sm text-muted-foreground">
            Update details for {employee.first_name} {employee.last_name}.
          </p>
        </div>
        <Link href={`/employees/${id}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <EditEmployeeForm 
            employee={employee} 
            updateAction={updateEmployeeWithId} 
            departments={departments || []} 
            positions={positions || []}
            dateHired={dateHired}
          />
          
          <Separator className="my-8" />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Statutory Applicability</h3>
            <StatutoryProfileManager employeeId={id} currentProfile={currentProfile} />
          </div>

          <div className="flex justify-end gap-4 pt-8">
            <Link href={`/employees/${id}`}>
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button form="edit-employee-form" type="submit">Update Employee</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
