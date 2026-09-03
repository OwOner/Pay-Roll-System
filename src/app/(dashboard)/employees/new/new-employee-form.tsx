"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { createEmployee } from "./actions"

export function NewEmployeeForm() {
  const [createAccount, setCreateAccount] = useState(false)

  return (
    <form action={createEmployee} className="space-y-8">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Personal Information</h3>
        
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
             <span className="text-slate-400 text-xs text-center px-2">Upload Photo</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar">Profile Picture</Label>
            <Input id="avatar" name="avatar" type="file" accept="image/*" />
            <p className="text-xs text-muted-foreground">JPG, PNG, or WebP. Max 2MB.</p>
          </div>
        </div>

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="juan@nexus.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" name="phone" placeholder="+63 912 345 6789" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select name="gender" defaultValue="">
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" placeholder="e.g. Sorsogon City" />
        </div>
      </div>

      <Separator />

      {/* Employment Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Employment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employee_code">Employee Code</Label>
            <Input id="employee_code" name="employee_code" placeholder="Auto-generated" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date_hired">Date Hired</Label>
            <Input id="date_hired" name="date_hired" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employment_type">Employment Type</Label>
            <Select name="employment_type" defaultValue="Regular">
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
            <Select name="employment_status" defaultValue="Active">
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

      <Separator />

      {/* System Account Provisioning */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-lg font-medium">System Account</h3>
            <p className="text-sm text-muted-foreground">
              Optionally provision a login account for this employee.
            </p>
          </div>
          <Switch 
            checked={createAccount}
            onCheckedChange={setCreateAccount}
            name="create_account_toggle" 
            id="create_account_toggle"
          />
          {/* Hidden input to ensure FormData captures it */}
          <input type="hidden" name="create_account" value={createAccount ? "true" : "false"} />
        </div>

        {createAccount && (
          <div className="space-y-6 p-4 border rounded-md bg-slate-50">
            <div className="space-y-2">
              <Label htmlFor="initial_password">Initial Password</Label>
              <Input id="initial_password" name="initial_password" type="password" placeholder="***************" required={createAccount} />
              <p className="text-xs text-muted-foreground">This password will only be used once for account creation and will never be stored by Nexus.</p>
            </div>

            <div className="space-y-3">
              <Label>Module Permissions</Label>
              <p className="text-sm text-muted-foreground mb-2">Select the modules this user is authorized to access.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="perm_dashboard" name="perm_dashboard" value="true" defaultChecked />
                  <Label htmlFor="perm_dashboard" className="font-normal">Dashboard</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="perm_employees" name="perm_employees" value="true" />
                  <Label htmlFor="perm_employees" className="font-normal">Employees</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="perm_attendance" name="perm_attendance" value="true" defaultChecked />
                  <Label htmlFor="perm_attendance" className="font-normal">Attendance</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="perm_leave" name="perm_leave" value="true" defaultChecked />
                  <Label htmlFor="perm_leave" className="font-normal">Leave</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="perm_payroll" name="perm_payroll" value="true" />
                  <Label htmlFor="perm_payroll" className="font-normal">Run Payroll</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="perm_history" name="perm_history" value="true" defaultChecked />
                  <Label htmlFor="perm_history" className="font-normal">Payroll History</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="perm_reports" name="perm_reports" value="true" />
                  <Label htmlFor="perm_reports" className="font-normal">Reports</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="perm_settings" name="perm_settings" value="true" />
                  <Label htmlFor="perm_settings" className="font-normal">Settings</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="perm_users" name="perm_users" value="true" />
                  <Label htmlFor="perm_users" className="font-normal">Users & Roles</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="perm_audit" name="perm_audit" value="true" />
                  <Label htmlFor="perm_audit" className="font-normal">Audit Logs</Label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Link href="/employees">
          <Button variant="outline" type="button">Cancel</Button>
        </Link>
        <Button type="submit">Save Employee</Button>
      </div>
    </form>
  )
}
