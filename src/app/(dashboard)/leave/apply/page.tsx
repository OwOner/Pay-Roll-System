import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default function ApplyLeavePage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">File a Leave</h2>
          <p className="text-sm text-muted-foreground">
            Submit a new leave request for approval.
          </p>
        </div>
        <Link href="/leave">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Details</CardTitle>
          <CardDescription>Fill in the dates and reason for your leave.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="leave_type">Leave Type</Label>
              <Select name="leave_type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vacation">Vacation Leave</SelectItem>
                  <SelectItem value="Sick">Sick Leave</SelectItem>
                  <SelectItem value="Maternity">Maternity Leave</SelectItem>
                  <SelectItem value="Paternity">Paternity Leave</SelectItem>
                  <SelectItem value="Unpaid">Unpaid Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input id="start_date" name="start_date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" name="end_date" type="date" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea 
                id="reason" 
                name="reason" 
                placeholder="Please specify the reason for your leave..."
                className="resize-none"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/leave">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="button">Submit Request</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
