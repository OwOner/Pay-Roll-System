"use client"

import { useState, useTransition, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calendar, Briefcase, Plus, AlertCircle, Info, Pencil, Trash2, Loader2 } from "lucide-react"
import { assignEmployeeWorkPolicy, removeEmployeeWorkPolicy, updateEmployeeWorkPolicy } from "./actions"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface WorkPolicyAssignment {
  id: string
  employee_id: string
  work_policy_id: string
  effective_from: string
  effective_to: string | null
  work_policies: {
    id: string
    name: string
    scheduled_hours_per_day: number
    scheduled_days_per_week: number
    rest_days: string[]
    ot_enabled: boolean
    ut_deduction_enabled: boolean
    night_differential_enabled: boolean
  } | null
}

interface EmployeeWorkPolicyTabProps {
  employee: {
    id: string
    first_name: string
    last_name: string
    employee_work_policies?: WorkPolicyAssignment[]
    positions?: {
      title: string
      default_work_policy_id: string | null
    } | null
  }
}

type DialogMode = "assign" | "edit" | null

interface FormState {
  work_policy_id: string
  effective_from: string
  effective_to: string
}

export function EmployeeWorkPolicyTab({ employee }: EmployeeWorkPolicyTabProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [editingAssignment, setEditingAssignment] = useState<WorkPolicyAssignment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WorkPolicyAssignment | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [availablePolicies, setAvailablePolicies] = useState<{ id: string; name: string }[]>([])
  const [policiesLoading, setPoliciesLoading] = useState(false)

  const [form, setForm] = useState<FormState>({
    work_policy_id: "",
    effective_from: new Date().toISOString().split("T")[0],
    effective_to: "",
  })

  const policies = employee.employee_work_policies || []
  const positionPolicyId = employee.positions?.default_work_policy_id

  const sortedPolicies = [...policies].sort(
    (a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime()
  )

  const activePolicy = sortedPolicies.find(
    (p) => !p.effective_to || new Date(p.effective_to) >= new Date()
  )

  // Load available work policies when dialog opens
  useEffect(() => {
    if (dialogMode) {
      setPoliciesLoading(true)
      const supabase = createClient()
      supabase
        .from("work_policies")
        .select("id, name")
        .eq("is_active", true)
        .order("name")
        .then(({ data }) => {
          setAvailablePolicies(data || [])
          setPoliciesLoading(false)
        })
    }
  }, [dialogMode])

  const openAssignDialog = () => {
    setEditingAssignment(null)
    setForm({
      work_policy_id: "",
      effective_from: new Date().toISOString().split("T")[0],
      effective_to: "",
    })
    setFormError(null)
    setDialogMode("assign")
  }

  const openEditDialog = (assignment: WorkPolicyAssignment) => {
    setEditingAssignment(assignment)
    setForm({
      work_policy_id: assignment.work_policy_id,
      effective_from: assignment.effective_from,
      effective_to: assignment.effective_to ?? "",
    })
    setFormError(null)
    setDialogMode("edit")
  }

  const handleSubmit = async () => {
    setFormError(null)
    if (!form.work_policy_id) {
      setFormError("Please select a work policy.")
      return
    }
    if (!form.effective_from) {
      setFormError("Effective from date is required.")
      return
    }
    if (form.effective_to && form.effective_to < form.effective_from) {
      setFormError("End date cannot be before the start date.")
      return
    }

    startTransition(async () => {
      let result: { error?: string; success?: boolean }

      if (dialogMode === "assign") {
        result = await assignEmployeeWorkPolicy({
          employee_id: employee.id,
          work_policy_id: form.work_policy_id,
          effective_from: form.effective_from,
          effective_to: form.effective_to || undefined,
        })
      } else if (dialogMode === "edit" && editingAssignment) {
        result = await updateEmployeeWorkPolicy(editingAssignment.id, employee.id, {
          work_policy_id: form.work_policy_id,
          effective_from: form.effective_from,
          effective_to: form.effective_to || undefined,
        })
      } else {
        return
      }

      if (result.error) {
        setFormError(result.error)
      } else {
        setDialogMode(null)
        router.refresh()
      }
    })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await removeEmployeeWorkPolicy(deleteTarget.id, employee.id)
      if (result.error) {
        alert("Failed to remove: " + result.error)
      } else {
        setDeleteTarget(null)
        router.refresh()
      }
    })
  }

  return (
    <>
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-100">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-slate-400" />
              Work Policy History
            </CardTitle>
            <CardDescription className="mt-1">
              Employee-specific schedules and payroll rules. Work Policy is optional.
            </CardDescription>
          </div>
          <Button onClick={openAssignDialog} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Assign Policy
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Status banners */}
          {!activePolicy && positionPolicyId && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Using Position Default</AlertTitle>
              <AlertDescription className="text-blue-700">
                No active employee-specific policy. The payroll engine will use the default Work Policy
                from the position: <strong>{employee.positions?.title}</strong>.
              </AlertDescription>
            </Alert>
          )}

          {!activePolicy && !positionPolicyId && (
            <Alert className="mb-6 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">No Policy Assigned</AlertTitle>
              <AlertDescription className="text-amber-700">
                No employee-specific or position-level policy. The payroll engine will fall back to the
                Company default if one exists. Work Policy is optional — attendance and leave still
                function normally without it.
              </AlertDescription>
            </Alert>
          )}

          {activePolicy && (
            <Alert className="mb-6 bg-emerald-50 border-emerald-200">
              <Briefcase className="h-4 w-4 text-emerald-600" />
              <AlertTitle className="text-emerald-800">
                Active Policy: {activePolicy.work_policies?.name}
              </AlertTitle>
              <AlertDescription className="text-emerald-700">
                {activePolicy.work_policies?.scheduled_hours_per_day}h/day ·{" "}
                {activePolicy.work_policies?.scheduled_days_per_week} days/week · Rest days:{" "}
                {activePolicy.work_policies?.rest_days?.join(", ") || "—"}
              </AlertDescription>
            </Alert>
          )}

          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="pl-6">Effective From</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Policy Name</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Features</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPolicies.length > 0 ? (
                sortedPolicies.map((p) => (
                  <TableRow key={p.id} className="hover:bg-slate-50">
                    <TableCell className="pl-6 font-medium text-slate-900">
                      {new Date(p.effective_from).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {p.effective_to ? (
                        new Date(p.effective_to).toLocaleDateString()
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                        >
                          Current
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">{p.work_policies?.name}</TableCell>
                    <TableCell>
                      {p.work_policies?.scheduled_hours_per_day}h /{" "}
                      {p.work_policies?.scheduled_days_per_week}d
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.work_policies?.ot_enabled && (
                          <Badge variant="outline" className="text-xs">OT</Badge>
                        )}
                        {p.work_policies?.ut_deduction_enabled && (
                          <Badge variant="outline" className="text-xs">UT</Badge>
                        )}
                        {p.work_policies?.night_differential_enabled && (
                          <Badge variant="outline" className="text-xs">Night Diff</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(p)}
                          className="h-8 px-2"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(p)}
                          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                    <p className="font-medium">No work policies assigned</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Work Policy is optional. Click &ldquo;Assign Policy&rdquo; to add one.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign / Edit Dialog */}
      <Dialog open={dialogMode !== null} onOpenChange={(open: boolean) => !open && setDialogMode(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "assign" ? "Assign Work Policy" : "Edit Policy Assignment"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "assign"
                ? `Assign a work policy to ${employee.first_name} ${employee.last_name}. Work Policy is optional.`
                : "Update the dates or policy for this assignment."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="wp-policy">Work Policy</Label>
              <Select
                value={form.work_policy_id}
                onValueChange={(v, _) => { if (v !== null) setForm((f) => ({ ...f, work_policy_id: v })) }}
                disabled={policiesLoading}
              >
                <SelectTrigger id="wp-policy">
                  <SelectValue placeholder={policiesLoading ? "Loading..." : "Select a policy"} />
                </SelectTrigger>
                <SelectContent>
                  {availablePolicies.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wp-from">Effective From</Label>
                <Input
                  id="wp-from"
                  type="date"
                  value={form.effective_from}
                  onChange={(e) => setForm((f) => ({ ...f, effective_from: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wp-to">
                  End Date{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="wp-to"
                  type="date"
                  value={form.effective_to}
                  onChange={(e) => setForm((f) => ({ ...f, effective_to: e.target.value }))}
                />
              </div>
            </div>

            {formError && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {formError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : dialogMode === "assign" ? (
                "Assign Policy"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove Policy Assignment?</DialogTitle>
            <DialogDescription>
              This will remove the{" "}
              <strong>{deleteTarget?.work_policies?.name}</strong> assignment (effective{" "}
              {deleteTarget ? new Date(deleteTarget.effective_from).toLocaleDateString() : ""}
              ). The employee will fall back to the position or company default.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isPending}
              variant="destructive"
            >
              {isPending ? "Removing..." : "Remove Assignment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
