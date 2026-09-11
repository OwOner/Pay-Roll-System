"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Loader2, Info } from "lucide-react"
import { addCompensationHistory } from "./actions"

type SalaryBasis = "Monthly" | "Daily" | "Weekly" | "Hourly"

const BASIS_LABELS: Record<SalaryBasis, { unit: string; question: string; hint: string }> = {
  Monthly:  { unit: "/ month",  question: "Monthly salary (fixed amount per month)",    hint: "e.g. ₱20,000/month for an office employee" },
  Daily:    { unit: "/ day",    question: "Daily rate (amount per day worked)",          hint: "e.g. ₱600/day for a construction worker" },
  Weekly:   { unit: "/ week",   question: "Weekly rate (fixed amount per week)",         hint: "e.g. ₱3,000/week" },
  Hourly:   { unit: "/ hour",   question: "Hourly rate (amount per hour worked)",        hint: "e.g. ₱100/hour for part-time or contractual" },
}

export function UpdateCompensationDialog({ employeeId }: { employeeId: string }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [salaryBasis, setSalaryBasis] = useState<SalaryBasis>("Monthly")
  const [rate, setRate] = useState<string>("")
  const [payFrequency, setPayFrequency] = useState<string>("Semi-Monthly")

  const basisMeta = BASIS_LABELS[salaryBasis]
  const rateNum = parseFloat(rate) || 0

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    fd.set("employee_id", employeeId)
    // Ensure the rate is submitted under the "rate" key
    fd.set("rate", rate)
    fd.set("salary_basis", salaryBasis)

    const result = await addCompensationHistory(fd)

    setIsLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
      setRate("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Update Salary
        </Button>
      } />
      <DialogContent className="sm:max-w-[460px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Update Compensation</DialogTitle>
            <DialogDescription>
              Enter the new salary details. This caps the previous record and starts a new one to preserve history.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            {error && (
              <div className="text-sm font-medium text-red-500 bg-red-50 p-3 rounded-md border border-red-100">
                {error}
              </div>
            )}

            {/* ── Salary Basis ── */}
            <div className="grid gap-2">
              <Label htmlFor="salary_basis" className="font-semibold">
                How is this employee&apos;s pay calculated?
              </Label>
              <Select
                name="salary_basis"
                value={salaryBasis}
                onValueChange={(v) => setSalaryBasis(v as SalaryBasis)}
                required
              >
                <SelectTrigger id="salary_basis">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly — fixed amount per month</SelectItem>
                  <SelectItem value="Daily">Daily — amount per day worked</SelectItem>
                  <SelectItem value="Weekly">Weekly — fixed amount per week</SelectItem>
                  <SelectItem value="Hourly">Hourly — amount per hour worked</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 flex gap-1 items-start">
                <Info className="w-3 h-3 mt-0.5 shrink-0 text-slate-400" />
                {basisMeta.hint}
              </p>
            </div>

            {/* ── Rate ── */}
            <div className="grid gap-2">
              <Label htmlFor="rate" className="font-semibold">
                Rate
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm select-none">₱</span>
                <Input
                  id="rate"
                  name="rate"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="pl-7 pr-24"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">
                  {basisMeta.unit}
                </span>
              </div>
              {rateNum > 0 && (
                <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                  ₱{rateNum.toLocaleString(undefined, { minimumFractionDigits: 2 })} {basisMeta.unit}
                </p>
              )}
            </div>

            {/* ── Pay Frequency ── */}
            <div className="grid gap-2">
              <Label htmlFor="pay_frequency" className="font-semibold">
                How often are they paid?
              </Label>
              <Select
                name="pay_frequency"
                value={payFrequency}
                onValueChange={(v) => setPayFrequency(v || "Semi-Monthly")}
                required
              >
                <SelectTrigger id="pay_frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Semi-Monthly">Semi-Monthly (twice a month)</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Bi-weekly">Bi-weekly (every 2 weeks)</SelectItem>
                  <SelectItem value="Daily">Daily</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                This controls when payroll is released — independent from how the rate is calculated.
              </p>
            </div>

            {/* ── Effective From ── */}
            <div className="grid gap-2">
              <Label htmlFor="effective_from" className="font-semibold">Effective From</Label>
              <Input
                id="effective_from"
                name="effective_from"
                type="date"
                required
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
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
