"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Edit, Trash2, Loader2, Shield } from "lucide-react"
import { WorkPolicyForm } from "@/components/settings/work-policy-form"
import { deleteWorkPolicy } from "./actions"

interface WorkPolicy {
  id: string
  name: string
  description: string | null
  scheduled_hours_per_day: number
  scheduled_days_per_week: number
  rest_days: string[]
  daily_rate_method: string
  annualization_factor: number | null
  is_active: boolean
  ot_enabled: boolean
  ut_deduction_enabled: boolean
  night_differential_enabled: boolean
  custom_day_rules: Record<string, unknown>
  rest_days_paid: boolean
  requires_ot_approval: boolean
}

interface WorkPoliciesClientProps {
  initialPolicies: WorkPolicy[]
}

export function WorkPoliciesClient({ initialPolicies }: WorkPoliciesClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<WorkPolicy | null>(null)
  const [editTarget, setEditTarget] = useState<WorkPolicy | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteWorkPolicy(deleteTarget.id)
      if (result?.error) {
        alert("Failed to delete: " + result.error)
      } else {
        setDeleteTarget(null)
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Work Policies</h3>
            <p className="text-sm text-muted-foreground">
              Manage employee work schedules and day-rate rules. Assigning a Work Policy to an employee
              is optional.
            </p>
          </div>

          <Button onClick={() => setCreateOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Policy
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {initialPolicies.map((policy) => (
            <Card key={policy.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-base truncate" title={policy.name}>
                  {policy.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {policy.description || "No description."}
                </CardDescription>
                <CardAction>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditTarget(policy)}
                      title="Edit policy"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(policy)}
                      title="Delete policy"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardAction>
              </CardHeader>
              <CardContent className="text-sm space-y-3 flex-1">
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>Schedule:</div>
                  <div className="text-foreground font-medium">
                    {policy.scheduled_hours_per_day}h / {policy.scheduled_days_per_week} days
                  </div>

                  <div>Method:</div>
                  <div
                    className="text-foreground font-medium truncate"
                    title={policy.daily_rate_method}
                  >
                    {policy.daily_rate_method.replace("annualized_", "")}
                    {policy.annualization_factor ? ` (${policy.annualization_factor})` : ""}
                  </div>

                  <div>Rest Days:</div>
                  <div
                    className="text-foreground font-medium truncate"
                    title={policy.rest_days?.join(", ")}
                  >
                    {policy.rest_days?.join(", ")}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100">
                  {policy.ot_enabled && (
                    <Badge variant="outline" className="text-xs">OT</Badge>
                  )}
                  {policy.ut_deduction_enabled && (
                    <Badge variant="outline" className="text-xs">UT Deduction</Badge>
                  )}
                  {policy.night_differential_enabled && (
                    <Badge variant="outline" className="text-xs">Night Diff</Badge>
                  )}
                  {policy.requires_ot_approval && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="h-2.5 w-2.5 mr-1" />
                      OT Approval
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {initialPolicies.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border rounded-lg border-dashed">
              No work policies defined yet. Click &ldquo;New Policy&rdquo; to create one.
            </div>
          )}
        </div>
      </div>

      {/* Create Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto pb-6">
          <SheetHeader className="mb-6 px-6 pt-6">
            <SheetTitle>Create Work Policy</SheetTitle>
            <SheetDescription>
              Define a standard work schedule and premium rules. The system will automatically
              enforce DOLE statutory minimums.
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 pb-6">
            <WorkPolicyForm onSuccess={() => { setCreateOpen(false); router.refresh() }} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto pb-6">
          <SheetHeader className="mb-6 px-6 pt-6">
            <SheetTitle>Edit Work Policy</SheetTitle>
            <SheetDescription>
              Update the work schedule and premium rules for <strong>{editTarget?.name}</strong>.
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 pb-6">
            {editTarget && (
              <WorkPolicyForm
                initialData={editTarget}
                onSuccess={() => { setEditTarget(null); router.refresh() }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Work Policy?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? Employees or
              positions currently using this policy will fall back to the company default. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isPending}
              variant="destructive"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete Policy"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
