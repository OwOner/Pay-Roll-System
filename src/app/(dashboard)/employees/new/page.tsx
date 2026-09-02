import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

import { createEmployee } from "./actions"

export default function NewEmployeePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Add New Employee</h2>
          <p className="text-sm text-muted-foreground">
            Enter the details for the new employee record.
          </p>
        </div>
        <Link href="/employees">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={createEmployee} className="space-y-8">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" name="first_name" placeholder="Juan" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middle_name">Middle Name</Label>
                  <Input id="middle_name" name="middle_name" placeholder="Santos" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" name="last_name" placeholder="Dela Cruz" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="juan@nexus.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" placeholder="+63 912 345 6789" />
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
                  <Input id="employee_code" name="employee_code" placeholder="EMP-001" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_hired">Date Hired</Label>
                  <Input id="date_hired" name="date_hired" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employment_type">Employment Type</Label>
                  <Input id="employment_type" name="employment_type" placeholder="Regular" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employment_status">Status</Label>
                  <Input id="employment_status" name="employment_status" placeholder="Active" defaultValue="Active" required />
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
                  <Input id="sss_number" name="sss_number" placeholder="00-0000000-0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="philhealth_number">PhilHealth Number</Label>
                  <Input id="philhealth_number" name="philhealth_number" placeholder="00-000000000-0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pagibig_number">Pag-IBIG Number</Label>
                  <Input id="pagibig_number" name="pagibig_number" placeholder="0000-0000-0000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tin_number">TIN Number</Label>
                  <Input id="tin_number" name="tin_number" placeholder="000-000-000-000" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/employees">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit">Save Employee</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
