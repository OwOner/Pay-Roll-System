"use client"

import { useState } from "react"
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
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="mr-2 h-4 w-4" />
        Update Salary
      </DialogTrigger>
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
              <Label htmlFor="basic_salary">Basic Salary (Monthly)</Label>
              <Input
                id="basic_salary"
                name="basic_salary"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="pay_frequency">Pay Frequency</Label>
              <Select name="pay_frequency" defaultValue="Semi-monthly" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Semi-monthly">Semi-monthly</SelectItem>
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
          <DialogFooter>
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
