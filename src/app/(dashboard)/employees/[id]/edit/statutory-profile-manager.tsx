"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Plus } from "lucide-react"
import { updateStatutoryProfile } from "./actions"

export function StatutoryProfileManager({ 
  employeeId, 
  currentProfile 
}: { 
  employeeId: string
  currentProfile: any 
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
    const result = await updateStatutoryProfile(employeeId, formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Statutory Applicability</h4>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Update Profile
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Update Statutory Profile</DialogTitle>
                <DialogDescription>
                  Create a new effective-dated applicability profile for this employee.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md font-medium border border-red-100">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="effective_from">Effective From Date</Label>
                  <Input id="effective_from" name="effective_from" type="date" required />
                  <p className="text-xs text-muted-foreground">The new rules will apply to any payroll periods ending on or after this date.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Change</Label>
                  <Input id="reason" name="reason" placeholder="e.g. Changed to consultant" required />
                </div>

                <div className="flex flex-col space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sss_applicable" name="sss_applicable" value="true" defaultChecked={currentProfile?.sss_applicable ?? true} />
                    <Label htmlFor="sss_applicable" className="font-normal text-sm">Subject to SSS</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="philhealth_applicable" name="philhealth_applicable" value="true" defaultChecked={currentProfile?.philhealth_applicable ?? true} />
                    <Label htmlFor="philhealth_applicable" className="font-normal text-sm">Subject to PhilHealth</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="pagibig_applicable" name="pagibig_applicable" value="true" defaultChecked={currentProfile?.pagibig_applicable ?? true} />
                    <Label htmlFor="pagibig_applicable" className="font-normal text-sm">Subject to Pag-IBIG</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Save Profile
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-slate-100 bg-slate-50/50">
          <p className="text-sm font-medium text-slate-500 mb-1">SSS</p>
          <p className="font-semibold text-slate-900">
            {currentProfile?.sss_applicable ? 'Applicable' : 'Not Applicable'}
          </p>
        </div>
        <div className="p-4 rounded-lg border border-slate-100 bg-slate-50/50">
          <p className="text-sm font-medium text-slate-500 mb-1">PhilHealth</p>
          <p className="font-semibold text-slate-900">
            {currentProfile?.philhealth_applicable ? 'Applicable' : 'Not Applicable'}
          </p>
        </div>
        <div className="p-4 rounded-lg border border-slate-100 bg-slate-50/50">
          <p className="text-sm font-medium text-slate-500 mb-1">Pag-IBIG</p>
          <p className="font-semibold text-slate-900">
            {currentProfile?.pagibig_applicable ? 'Applicable' : 'Not Applicable'}
          </p>
        </div>
      </div>
      
      {currentProfile && (
        <p className="text-xs text-slate-500">
          Current profile effective since {new Date(currentProfile.effective_from).toLocaleDateString()}.
        </p>
      )}
    </div>
  )
}
