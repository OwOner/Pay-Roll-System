"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Plus, Power, Edit, Trash2, Copy } from "lucide-react"
import { createStatutorySchedule, supersedeStatutorySchedule, toggleStatutoryScheduleActive, deleteStatutorySchedule, AllocationInput } from "./statutory-schedule-actions"

export default function StatutoryScheduleClient({ initialSchedules }: { initialSchedules: any[] }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit' | 'supersede'>('create')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    pay_frequency: 'Semi-Monthly',
    description: '',
    effective_from: new Date().toISOString().split('T')[0],
  })

  const [allocations, setAllocations] = useState<AllocationInput[]>([])

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      pay_frequency: 'Semi-Monthly',
      description: '',
      effective_from: new Date().toISOString().split('T')[0],
    })
    setAllocations([])
    setError(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setMode('create')
    setOpen(true)
  }

  const handleOpenEdit = (schedule: any, supersede: boolean) => {
    resetForm()
    setMode(supersede ? 'supersede' : 'edit')
    setFormData({
      id: schedule.id,
      name: supersede ? `${schedule.name} (v2)` : schedule.name,
      pay_frequency: schedule.pay_frequency,
      description: schedule.description || '',
      effective_from: supersede ? new Date().toISOString().split('T')[0] : schedule.effective_from,
    })
    setAllocations(schedule.allocations.map((a: any) => ({
      period_sequence: a.period_sequence,
      contribution_type: a.contribution_type,
      allocation_percentage: a.allocation_percentage
    })))
    setOpen(true)
  }

  const handleAddAllocation = () => {
    setAllocations([...allocations, { period_sequence: 1, contribution_type: 'SSS', allocation_percentage: 100 }])
  }

  const updateAllocation = (index: number, field: string, value: any) => {
    const newAlloc = [...allocations]
    newAlloc[index] = { ...newAlloc[index], [field]: value }
    setAllocations(newAlloc)
  }

  const removeAllocation = (index: number) => {
    const newAlloc = [...allocations]
    newAlloc.splice(index, 1)
    setAllocations(newAlloc)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Basic client-side validation
    if (!formData.name) {
      setError("Name is required.")
      setLoading(false)
      return
    }

    let res
    if (mode === 'create') {
      res = await createStatutorySchedule({ ...formData, allocations })
    } else if (mode === 'supersede') {
      res = await supersedeStatutorySchedule(formData.id, { ...formData, allocations })
    } else {
      // For simple edit of not-yet-used schedules, we'd normally delete and recreate or update directly.
      // But for simplicity in this task, if it's not immutable, we can supersede it or just not support direct edit.
      // To properly edit, we'd need an updateStatutorySchedule action. 
      // Let's implement supersede for 'supersede' and for 'edit' we can just warn it's not supported in this simple client unless we write update action.
      // Wait, we didn't write updateStatutorySchedule. Let's just always Supersede for edits to be safe, or just tell the user they can delete and recreate if it's not immutable.
      setError("Direct edit is not supported yet. Please use Supersede.")
      setLoading(false)
      return
    }

    if (!res.success) {
      setError(res.error!)
    } else {
      setOpen(false)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 w-4 h-4" /> New Schedule
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Create Statutory Schedule' : mode === 'supersede' ? 'Duplicate & Supersede Schedule' : 'Edit Schedule'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Schedule Name</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Weekly 2026 Rules" required />
              </div>
              <div className="space-y-2">
                <Label>Pay Frequency</Label>
                <Select value={formData.pay_frequency} onValueChange={v => { if(v) setFormData({...formData, pay_frequency: v}) }} disabled={mode === 'supersede'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Semi-Monthly">Semi-Monthly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Effective From</Label>
                <Input type="date" value={formData.effective_from} onChange={e => setFormData({...formData, effective_from: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Optional notes" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">Allocations</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddAllocation}>
                  <Plus className="w-4 h-4 mr-2" /> Add Rule
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period Sequence</TableHead>
                    <TableHead>Contribution Type</TableHead>
                    <TableHead>Allocation (%)</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Input type="number" min={1} value={a.period_sequence} onChange={e => updateAllocation(i, 'period_sequence', Number(e.target.value))} className="w-24" />
                      </TableCell>
                      <TableCell>
                        <Select value={a.contribution_type} onValueChange={v => updateAllocation(i, 'contribution_type', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SSS">SSS</SelectItem>
                            <SelectItem value="PhilHealth">PhilHealth</SelectItem>
                            <SelectItem value="Pag-IBIG">Pag-IBIG</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.01" min={0} max={100} value={a.allocation_percentage} onChange={e => updateAllocation(i, 'allocation_percentage', Number(e.target.value))} className="w-32" />
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeAllocation(i)} className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {allocations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-4">No allocations defined.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {/* Client-side preview of totals */}
              <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 flex gap-6">
                <div><strong>SSS Total:</strong> {allocations.filter(a => a.contribution_type === 'SSS').reduce((sum, a) => sum + Number(a.allocation_percentage), 0)}%</div>
                <div><strong>PhilHealth Total:</strong> {allocations.filter(a => a.contribution_type === 'PhilHealth').reduce((sum, a) => sum + Number(a.allocation_percentage), 0)}%</div>
                <div><strong>Pag-IBIG Total:</strong> {allocations.filter(a => a.contribution_type === 'Pag-IBIG').reduce((sum, a) => sum + Number(a.allocation_percentage), 0)}%</div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {initialSchedules.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">No statutory schedules configured yet.</p>
          </CardContent>
        </Card>
      )}

      {initialSchedules.map((table) => (
        <Card key={table.id} className={table.is_immutable ? 'border-l-4 border-l-slate-400' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{table.name}</CardTitle>
                <Badge variant="outline" className="bg-slate-100">{table.pay_frequency}</Badge>
                {table.is_immutable && (
                  <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200" title="This schedule has been used in a finalized payroll run and cannot be edited.">
                    🔒 Immutable
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-1">
                Effective: {new Date(table.effective_from).toLocaleDateString()} 
                {table.effective_to ? ` - ${new Date(table.effective_to).toLocaleDateString()}` : ' - Present'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {table.is_active ? <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
              <form action={async (fd) => { await toggleStatutoryScheduleActive(fd); }}>
                <input type="hidden" name="id" value={table.id} />
                <input type="hidden" name="is_active" value={table.is_active ? 'true' : 'false'} />
                <Button type="submit" variant="ghost" size="sm" className={table.is_active ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}>
                  <Power className="w-4 h-4 mr-2" />
                  {table.is_active ? 'Disable' : 'Enable'}
                </Button>
              </form>
              
              <Button variant="outline" size="sm" onClick={() => handleOpenEdit(table, true)}>
                <Copy className="w-4 h-4 mr-2" />
                Supersede
              </Button>

              {!table.is_immutable && (
                 <form action={async (fd) => { await deleteStatutorySchedule(fd); }}>
                   <input type="hidden" name="id" value={table.id} />
                   <Button type="submit" variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                     <Trash2 className="w-4 h-4" />
                   </Button>
                 </form>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {table.description && <p className="text-sm text-slate-500 mb-4">{table.description}</p>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sequence</TableHead>
                  <TableHead>SSS</TableHead>
                  <TableHead>PhilHealth</TableHead>
                  <TableHead>Pag-IBIG</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Group allocations by period sequence for display */}
                {Array.from(new Set(table.allocations.map((a: any) => a.period_sequence))).sort((a: any, b: any) => a - b).map((seq: any) => {
                  const sss = table.allocations.find((a: any) => a.period_sequence === seq && a.contribution_type === 'SSS')?.allocation_percentage || 0
                  const phic = table.allocations.find((a: any) => a.period_sequence === seq && a.contribution_type === 'PhilHealth')?.allocation_percentage || 0
                  const hdmf = table.allocations.find((a: any) => a.period_sequence === seq && a.contribution_type === 'Pag-IBIG')?.allocation_percentage || 0
                  return (
                    <TableRow key={seq}>
                      <TableCell className="font-medium">Sequence {seq}</TableCell>
                      <TableCell>{sss}%</TableCell>
                      <TableCell>{phic}%</TableCell>
                      <TableCell>{hdmf}%</TableCell>
                    </TableRow>
                  )
                })}
                {(!table.allocations || table.allocations.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No allocations defined.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
