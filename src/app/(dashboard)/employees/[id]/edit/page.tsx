import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { updateEmployee } from "./actions"

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: employee, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !employee) {
    return notFound()
  }

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
          <form action={updateEmployeeWithId} className="space-y-8">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" name="first_name" defaultValue={employee.first_name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middle_name">Middle Name</Label>
                  <Input id="middle_name" name="middle_name" defaultValue={employee.middle_name || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" name="last_name" defaultValue={employee.last_name} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={employee.email || ''} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" defaultValue={employee.phone || ''} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Employment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Employment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_code">Employee Code</Label>
                  <Input id="employee_code" name="employee_code" defaultValue={employee.employee_code} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_hired">Date Hired</Label>
                  <Input id="date_hired" name="date_hired" type="date" defaultValue={dateHired} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employment_type">Employment Type</Label>
                  <Input id="employment_type" name="employment_type" defaultValue={employee.employment_type} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employment_status">Status</Label>
                  <Input id="employment_status" name="employment_status" defaultValue={employee.employment_status} required />
                </div>
              </div>
            </div>

            <Separator />

            {/* Government Numbers */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Government Contributions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sss_number">SSS Number</Label>
                  <Input id="sss_number" name="sss_number" defaultValue={employee.sss_number || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="philhealth_number">PhilHealth Number</Label>
                  <Input id="philhealth_number" name="philhealth_number" defaultValue={employee.philhealth_number || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pagibig_number">Pag-IBIG Number</Label>
                  <Input id="pagibig_number" name="pagibig_number" defaultValue={employee.pagibig_number || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tin_number">TIN Number</Label>
                  <Input id="tin_number" name="tin_number" defaultValue={employee.tin_number || ''} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href={`/employees/${id}`}>
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit">Update Employee</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
