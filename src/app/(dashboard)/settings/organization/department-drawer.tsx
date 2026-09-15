"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { upsertDepartment } from "./organization-actions"

export default function DepartmentDrawer({ 
  open, 
  onOpenChange, 
  department, 
  onSaved 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  department: any | null
  onSaved: () => void
}) {
  const [name, setName] = useState(department?.name || "")
  const [description, setDescription] = useState(department?.description || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name is required")
      return
    }

    setLoading(true)
    setError("")
    const res = await upsertDepartment(department?.id || null, name, description)
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
          <SheetTitle>{department ? "Edit Department" : "Add Department"}</SheetTitle>
          <SheetDescription>
            Departments group your employees into functional teams.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <Label>Department Name</Label>
            <Input 
              placeholder="e.g. Engineering" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          </div>
          
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea 
              placeholder="What does this department do?" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              rows={4}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Department
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
