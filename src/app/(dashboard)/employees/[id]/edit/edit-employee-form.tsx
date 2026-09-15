"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function EditEmployeeForm({
  employee,
  updateAction,
  departments,
  positions,
  dateHired
}: {
  employee: any
  updateAction: any
  departments: any[]
  positions: any[]
  dateHired: string
}) {
  const [selectedDeptId, setSelectedDeptId] = useState<string>(employee.department_id || "none")
  const [selectedPosId, setSelectedPosId] = useState<string>(employee.position_id || "none")

  // Filter positions based on selected department
  const availablePositions = selectedDeptId && selectedDeptId !== "none"
    ? positions.filter(p => p.department_id === selectedDeptId || !p.department_id)
    : positions;

  return (
    <form id="edit-employee-form" action={updateAction} className="space-y-8">
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
            <Input id="employee_code" name="employee_code" defaultValue={employee.employee_code} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department_id">Department (Optional)</Label>
            <Select name="department_id" value={selectedDeptId} onValueChange={(v) => setSelectedDeptId(v || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None / Unassigned</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="position_id">Position (Optional)</Label>
            <Select name="position_id" value={selectedPosId} onValueChange={(v) => setSelectedPosId(v || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None / Unassigned</SelectItem>
                {availablePositions.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date_hired">Date Hired</Label>
            <Input id="date_hired" name="date_hired" type="date" defaultValue={dateHired} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employment_type">Employment Type</Label>
            <Select name="employment_type" defaultValue={employee.employment_type}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="Project-based">Project-based</SelectItem>
                <SelectItem value="Probationary">Probationary</SelectItem>
                <SelectItem value="Contractual">Contractual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="employment_status">Status</Label>
            <Select name="employment_status" defaultValue={employee.employment_status}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Resigned">Resigned</SelectItem>
                <SelectItem value="Terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
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
    </form>
  )
}
