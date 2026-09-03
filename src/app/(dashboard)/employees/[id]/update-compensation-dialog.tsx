"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"
import { addCompensationHistory } from "./actions"

export function UpdateCompensationDialog({ employeeId }: { employeeId: string }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // State for dynamic UI
  const [salaryRate, setSalaryRate] = useState<number>(0)
  const [frequency, setFrequency] = useState<string>("Semi-monthly")

  async function onSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    
    formData.append("employee_id", employeeId)
    const result = await addCompensationHistory(formData)
    
    setIsLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
      // Reset state on success if needed
      setSalaryRate(0)
    }
  }

  // Calculate dynamic labels
  const annualizedSalary = useMemo(() => {
    if (!salaryRate || isNaN(salaryRate)) return 0;
    switch (frequency) {
      case 'Weekly': return salaryRate * 52;
      case 'Bi-weekly': return salaryRate * 26;
      case 'Semi-monthly': return salaryRate * 24;
      case 'Monthly': return salaryRate * 12;
      case 'Daily': return salaryRate * 261;
      default: return 0;
    }
  }, [salaryRate, frequency]);

  const frequencyLabel = useMemo(() => {
    if (!salaryRate || isNaN(salaryRate)) return "";
    switch (frequency) {
      case 'Weekly': return `₱${salaryRate.toLocaleString(undefined, {minimumFractionDigits: 2})} per week`;
      case 'Bi-weekly': return `₱${salaryRate.toLocaleString(undefined, {minimumFractionDigits: 2})} every 2 weeks`;
      case 'Semi-monthly': return `₱${salaryRate.toLocaleString(undefined, {minimumFractionDigits: 2})} per half-month`;
      case 'Monthly': return `₱${salaryRate.toLocaleString(undefined, {minimumFractionDigits: 2})} per month`;
      case 'Daily': return `₱${salaryRate.toLocaleString(undefined, {minimumFractionDigits: 2})} per day`;
      default: return "";
    }
  }, [salaryRate, frequency]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Update Salary
        </Button>
      } />
      <DialogContent className="sm:max-w-[425px]">
        <form action={onSubmit}>
          <DialogHeader>
            <DialogTitle>Update Compensation</DialogTitle>
            <DialogDescription>
              Enter the new salary details. This will cap the previous salary period and start a new one to preserve history.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="text-sm font-medium text-red-500 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="basic_salary">Basic Salary / Rate</Label>
              <Input
                id="basic_salary"
                name="basic_salary"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={salaryRate || ''}
                onChange={(e) => setSalaryRate(parseFloat(e.target.value))}
                required
              />
              {frequencyLabel && (
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  {frequencyLabel}
                </p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="pay_frequency">Pay Frequency</Label>
              <Select name="pay_frequency" value={frequency} onValueChange={(v) => setFrequency(v || "Semi-monthly")} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Semi-monthly">Semi-monthly</SelectItem>
                  <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="effective_from">Effective From</Label>
              <Input
                id="effective_from"
                name="effective_from"
                type="date"
                required
              />
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-md flex justify-between items-center mt-2">
            <span className="text-sm font-medium">Estimated Annualized Salary</span>
            <span className="text-base font-bold">₱{annualizedSalary.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Compensation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
