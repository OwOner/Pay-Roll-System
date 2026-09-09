"use client"

import { useState } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { STATUTORY_RULES, DayType } from "@/lib/payroll/day-rules"
import { createWorkPolicy, updateWorkPolicy } from "@/app/(dashboard)/settings/work-policies/actions"
import { useToast } from "@/hooks/use-toast"

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const dayRuleEntrySchema = z.object({
  base_multiplier: z.number().optional(),
  ot_multiplier: z.number().optional(),
  night_multiplier: z.number().optional(),
})

type DayRuleEntry = z.infer<typeof dayRuleEntrySchema>

const dayRulesSchema = z.record(z.string(), dayRuleEntrySchema)

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().optional(),
  scheduled_hours_per_day: z.number().min(1).max(24),
  scheduled_days_per_week: z.number().min(1).max(7),
  rest_days: z.array(z.string()).min(1, "Select at least one rest day."),
  rest_days_paid: z.boolean().default(false),
  daily_rate_method: z.enum([
    'annualized_313', 
    'annualized_261', 
    'annualized_393_5', 
    'actual_days_worked', 
    'weekly_preserved',
    'daily_preserved'
  ]),
  annualization_factor: z.number().optional(),
  ot_enabled: z.boolean().default(true),
  requires_ot_approval: z.boolean().default(true),
  ut_deduction_enabled: z.boolean().default(true),
  night_differential_enabled: z.boolean().default(true),
  custom_day_rules: dayRulesSchema.optional().default({})
})

type FormValues = z.infer<typeof formSchema>

export function WorkPolicyForm({ onSuccess, initialData }: { onSuccess?: () => void, initialData?: any }) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description || "",
      scheduled_hours_per_day: Number(initialData.scheduled_hours_per_day),
      scheduled_days_per_week: Number(initialData.scheduled_days_per_week),
      rest_days: initialData.rest_days || [],
      rest_days_paid: initialData.rest_days_paid,
      daily_rate_method: initialData.daily_rate_method,
      annualization_factor: initialData.annualization_factor ? Number(initialData.annualization_factor) : undefined,
      ot_enabled: initialData.ot_enabled,
      requires_ot_approval: initialData.requires_ot_approval,
      ut_deduction_enabled: initialData.ut_deduction_enabled,
      night_differential_enabled: initialData.night_differential_enabled,
      custom_day_rules: initialData.custom_day_rules || {}
    } : {
      name: "",
      description: "",
      scheduled_hours_per_day: 8,
      scheduled_days_per_week: 5,
      rest_days: ["Saturday", "Sunday"],
      rest_days_paid: false,
      daily_rate_method: "annualized_261",
      annualization_factor: 261,
      ot_enabled: true,
      requires_ot_approval: true,
      ut_deduction_enabled: true,
      night_differential_enabled: true,
      custom_day_rules: {}
    },
  })

  // Watch for custom rules to show warnings
  const customRules = form.watch("custom_day_rules") || {}
  const warnings: string[] = []

  Object.keys(customRules).forEach((dayTypeKey) => {
    const dayType = dayTypeKey as DayType
    const statutory = STATUTORY_RULES[dayType]
    const custom = customRules[dayType] as DayRuleEntry | undefined

    if (statutory && custom) {
      if (custom.base_multiplier && custom.base_multiplier < statutory.baseMultiplier.toNumber()) {
        warnings.push(`${dayType}: Custom Base Multiplier (${custom.base_multiplier}x) is below statutory minimum (${statutory.baseMultiplier.toNumber()}x).`)
      }
      if (custom.ot_multiplier && custom.ot_multiplier < statutory.otMultiplier.toNumber()) {
        warnings.push(`${dayType}: Custom OT Multiplier (${custom.ot_multiplier}x) is below statutory minimum (${statutory.otMultiplier.toNumber()}x).`)
      }
      if (custom.night_multiplier && custom.night_multiplier < statutory.nightDifferentialMultiplier.toNumber()) {
        warnings.push(`${dayType}: Custom Night Differential (${custom.night_multiplier}x) is below statutory minimum (${statutory.nightDifferentialMultiplier.toNumber()}x).`)
      }
    }
  })

  async function onSubmit(data: FormValues) {
    if (warnings.length > 0) {
      toast({
        title: "Validation Error",
        description: "Cannot save policy with rates below statutory minimums. Please correct the warnings.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = initialData 
        ? await updateWorkPolicy(initialData.id, { ...data, annualization_factor: data.annualization_factor ?? null })
        : await createWorkPolicy({ ...data, annualization_factor: data.annualization_factor ?? null })

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: initialData ? "Work policy updated successfully." : "Work policy created successfully.",
        })
        form.reset()
        if (onSuccess) onSuccess()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8">
        
        {warnings.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Statutory Minimum Violations Detected</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4 mt-2">
                {warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
              <p className="mt-2 font-medium">The payroll engine will refuse to produce an under-minimum result. You must fix these before saving.</p>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control as any}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Policy Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Construction 6-Day" {...(field as any)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Optional description" {...(field as any)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control as any}
            name="scheduled_hours_per_day"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scheduled Hours per Day</FormLabel>
                <FormControl>
                  <Input type="number" {...(field as any)} value={Number.isNaN(field.value) ? "" : field.value} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : "")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="scheduled_days_per_week"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scheduled Days per Week</FormLabel>
                <FormControl>
                  <Input type="number" {...(field as any)} value={Number.isNaN(field.value) ? "" : field.value} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : "")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control as any}
          name="rest_days"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Rest Days</FormLabel>
                <FormDescription>Select the scheduled rest days for this policy.</FormDescription>
              </div>
              <div className="flex flex-wrap gap-4">
                {DAYS_OF_WEEK.map((day) => (
                  <FormField
                    key={day}
                    control={form.control as any}
                    name="rest_days"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={day}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(day)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, day])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value: string) => value !== day
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {day}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control as any}
            name="daily_rate_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daily Rate Method</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="annualized_261">Annualized 261-Day Method</SelectItem>
                    <SelectItem value="annualized_313">Annualized 313-Day Method</SelectItem>
                    <SelectItem value="annualized_393_5">Annualized 393.5-Day Method</SelectItem>
                    <SelectItem value="weekly_preserved">Weekly Preserved (No Annualization)</SelectItem>
                    <SelectItem value="daily_preserved">Daily Preserved (No Annualization)</SelectItem>
                    <SelectItem value="actual_days_worked">Actual Days Worked</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Used for employees whose daily-rate calculation follows the selected NWPC annualization method.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="annualization_factor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Annualization Factor (if applicable)</FormLabel>
                <FormControl>
                  <Input type="number" {...(field as any)} value={Number.isNaN(field.value) ? "" : field.value ?? ""} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                </FormControl>
                <FormDescription>e.g., 261, 313, 393.5. Required for Annualized methods.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 border rounded-md p-4">
          <h3 className="font-medium text-lg">Controls & Toggles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="ot_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Overtime Enabled</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="requires_ot_approval"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Requires OT Approval</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="ut_deduction_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Undertime Deduction</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="night_differential_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Night Differential</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4 border rounded-md p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-lg">Custom Premium Rules</h3>
              <p className="text-sm text-muted-foreground">Override statutory minimums with higher company rates. (Leave blank to use statutory defaults).</p>
            </div>
            <Button type="button" variant="outline" onClick={() => {
              // Populate default template
              form.setValue("custom_day_rules", {
                'Regular Workday': { ot_multiplier: 1.50 },
                'Scheduled Rest Day': { base_multiplier: 1.50, ot_multiplier: 1.50 }
              })
            }}>
              Load Example
            </Button>
          </div>
          
          <FormField
            control={form.control as any}
            name="custom_day_rules"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea 
                    placeholder='{"Regular Workday": {"ot_multiplier": 1.50}}' 
                    className="font-mono text-xs" 
                    rows={8}
                    value={JSON.stringify(field.value, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value)
                        field.onChange(parsed)
                      } catch (err) {
                        // ignore parse errors while typing, but ideally we'd show a syntax error state
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>Must be valid JSON.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting || warnings.length > 0}>
          {isSubmitting ? "Saving..." : initialData ? "Update Work Policy" : "Save Work Policy"}
        </Button>
      </form>
    </Form>
  )
}
