import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function HolidaysSettingsPage() {
  const supabase = await createClient()
  const { data: holidays } = await supabase
    .from('holidays')
    .select('*, holiday_pay_rules(*)')
    .order('holiday_date', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Holidays</h3>
          <p className="text-sm text-muted-foreground">
            Manage public holidays and special non-working days.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Manage Rules</Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Holiday
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendar Year 2026</CardTitle>
          <CardDescription>Upcoming holidays.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Holiday Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Multiplier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays && holidays.length > 0 ? (
                holidays.map((h: any) => (
                  <TableRow key={h.id}>
                    <TableCell>{new Date(h.holiday_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{h.name}</TableCell>
                    <TableCell>{h.holiday_pay_rules?.holiday_type}</TableCell>
                    <TableCell className="text-right">
                      {h.holiday_pay_rules?.multiplier ? `${h.holiday_pay_rules.multiplier * 100}%` : '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No holidays configured for this year.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
