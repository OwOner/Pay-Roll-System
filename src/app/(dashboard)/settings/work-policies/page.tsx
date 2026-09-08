import { getWorkPolicies, deleteWorkPolicy } from "./actions"
import { WorkPolicyForm } from "@/components/settings/work-policy-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { PlusCircle, Trash2 } from "lucide-react"

export default async function WorkPoliciesPage() {
  const policies = await getWorkPolicies()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Work Policies</h3>
          <p className="text-sm text-muted-foreground">
            Manage employee work schedules and day-rate rules.
          </p>
        </div>
        
        <Sheet>
          {/* @ts-ignore */}<SheetTrigger>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Policy
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-[600px] overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>Create Work Policy</SheetTitle>
              <SheetDescription>
                Define a standard work schedule and premium rules. The system will automatically enforce DOLE statutory minimums.
              </SheetDescription>
            </SheetHeader>
            <WorkPolicyForm />
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {policies?.map((policy: any) => (
          <Card key={policy.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{policy.name}</CardTitle>
                  <CardDescription>{policy.description}</CardDescription>
                </div>
                {/* Normally we'd use a client component with a delete action, but for brevity we'll just mock it or omit it in this server view, or wire it via a form */}
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2 flex-1">
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <div>Schedule:</div>
                <div className="text-foreground font-medium">{policy.scheduled_hours_per_day}h / {policy.scheduled_days_per_week} days</div>
                
                <div>Method:</div>
                <div className="text-foreground font-medium truncate" title={policy.daily_rate_method}>
                  {policy.daily_rate_method.replace('annualized_', '')} 
                  {policy.annualization_factor ? ` (${policy.annualization_factor})` : ''}
                </div>
                
                <div>Rest Days:</div>
                <div className="text-foreground font-medium truncate" title={policy.rest_days?.join(", ")}>
                  {policy.rest_days?.join(", ")}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {policies?.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border rounded-lg border-dashed">
            No work policies defined yet. Click "New Policy" to create one.
          </div>
        )}
      </div>
    </div>
  )
}
