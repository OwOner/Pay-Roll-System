"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { upsertPosition } from "./organization-actions"

export default function PositionDrawer({ 
  open, 
  onOpenChange, 
  position, 
  departments,
  workPolicies,
  onSaved 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  position: any | null
  departments: any[]
  workPolicies: any[]
  onSaved: () => void
}) {
  const [title, setTitle] = useState(position?.title || "")
  const [description, setDescription] = useState(position?.description || "")
  const [departmentId, setDepartmentId] = useState<string>(position?.department_id || "")
  const [policyId, setPolicyId] = useState<string>(position?.default_work_policy_id || "")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required")
      return
    }

    setLoading(true)
    setError("")
    
    const payload = {
      title,
      description,
      department_id: departmentId || null,
      default_work_policy_id: policyId || null
    }

    const res = await upsertPosition(position?.id || null, payload)
    if (res.error) {
      setError(res.error)
    } else {
      onSaved()
      onOpenChange(false)
    }
    setLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>{position ? "Edit Position" : "Add Position"}</SheetTitle>
          <SheetDescription>
            Define job titles and their default policies.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <Label>Job Title</Label>
            <Input 
              placeholder="e.g. Software Engineer" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label>Department (Optional)</Label>
            <Select name="department_id" value={departmentId} onValueChange={(v) => setDepartmentId(v || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a department..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">None / Unassigned</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Default Work Policy (Optional)</Label>
            <Select name="default_work_policy_id" value={policyId} onValueChange={(v) => setPolicyId(v || "")}>
              <SelectTrigger>
                <SelectValue placeholder="No default policy..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">None (Use Statutory Defaults)</SelectItem>
                {workPolicies.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Employees assigned to this position will automatically inherit this work policy unless overridden.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea 
              placeholder="Job responsibilities..." 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Position
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
