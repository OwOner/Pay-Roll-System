"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Plus, Check, X, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createCashAdvance, updateCashAdvance, toggleCashAdvanceStatus } from "./actions" 
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Edit2, Pause, Play } from "lucide-react"

export function CashAdvancesTab({ employeeId, cashAdvances = [] }: { employeeId: string, cashAdvances: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const activeAdvances = cashAdvances.filter(ca => ['Active', 'Partially Paid', 'Paused'].includes(ca.status))
  const historyAdvances = cashAdvances.filter(ca => ['Fully Paid', 'Cancelled'].includes(ca.status))

  const [editOpen, setEditOpen] = useState(false)
  const [selectedCA, setSelectedCA] = useState<any>(null)

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      const result = await updateCashAdvance(formData)
      if (result.success) {
        toast({ title: "Repayment amount updated" })
        setEditOpen(false)
        setSelectedCA(null)
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleStatus(ca: any) {
    const newStatus = ca.status === 'Paused' ? 'Active' : 'Paused'
    setLoading(true)
    try {
      const result = await toggleCashAdvanceStatus(ca.id, employeeId, newStatus)
      if (result.success) {
        toast({ title: `Cash advance ${newStatus.toLowerCase()}` })
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await createCashAdvance(formData)
      if (result.success) {
        toast({ title: "Cash advance added" })
        setIsOpen(false)
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Cash Advances</h3>
          <p className="text-sm text-muted-foreground">Manage loans and cash advances for this employee.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2"/> Add Cash Advance</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Cash Advance</DialogTitle>
              <DialogDescription>Record a new cash advance. It will automatically be deducted during payroll runs.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <input type="hidden" name="employee_id" value={employeeId} />
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">Amount</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" min="1" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Date Issued</Label>
                  <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="repayment_amount_per_payroll" className="text-right">Repayment/Payroll</Label>
                  <Input id="repayment_amount_per_payroll" name="repayment_amount_per_payroll" type="number" step="0.01" min="1" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="reason" className="text-right pt-2">Reason</Label>
                  <Textarea id="reason" name="reason" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Cash Advances</CardTitle>
          <CardDescription>Currently active or partially paid advances.</CardDescription>
        </CardHeader>
        <CardContent>
          {activeAdvances.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
              No active cash advances.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Original Amount</TableHead>
                  <TableHead className="text-right">Repayment</TableHead>
                  <TableHead className="text-right">Remaining Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAdvances.map(ca => (
                  <TableRow key={ca.id}>
                    <TableCell>{format(new Date(ca.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{ca.reason || '-'}</TableCell>
                    <TableCell className="text-right">₱{Number(ca.amount).toLocaleString()}</TableCell>
                    <TableCell className="text-right">₱{Number(ca.repayment_amount_per_payroll).toLocaleString()}/run</TableCell>
                    <TableCell className="text-right font-medium">₱{Number(ca.remaining_balance).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={ca.status === 'Active' || ca.status === 'Partially Paid' ? 'default' : 'secondary'}>{ca.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleToggleStatus(ca)} disabled={loading}>
                        {ca.status === 'Paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedCA(ca); setEditOpen(true) }} disabled={loading}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Repayment Amount</DialogTitle>
            <DialogDescription>Update the amount deducted per payroll run.</DialogDescription>
          </DialogHeader>
          {selectedCA && (
            <form onSubmit={handleEditSubmit}>
              <input type="hidden" name="id" value={selectedCA.id} />
              <input type="hidden" name="employee_id" value={employeeId} />
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="repayment_amount_per_payroll_edit" className="text-right">Repayment/Payroll</Label>
                  <Input id="repayment_amount_per_payroll_edit" name="repayment_amount_per_payroll" type="number" step="0.01" min="1" defaultValue={selectedCA.repayment_amount_per_payroll} className="col-span-3" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setEditOpen(false); setSelectedCA(null) }}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Fully paid or cancelled cash advances.</CardDescription>
        </CardHeader>
        <CardContent>
          {historyAdvances.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No history available.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyAdvances.map(ca => (
                  <TableRow key={ca.id}>
                    <TableCell>{format(new Date(ca.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{ca.reason || '-'}</TableCell>
                    <TableCell className="text-right">₱{Number(ca.amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ca.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
