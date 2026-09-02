import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Power } from "lucide-react"
import { initializeDefaultTaxes, createNewTaxTable, toggleTaxTableActive } from "./actions"

export default async function TaxSettingsPage() {
  const supabase = await createClient()
  const { data: taxTables } = await supabase
    .from('tax_tables')
    .select('*, tax_brackets(*)')
    .order('effective_from', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Tax Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Manage Philippine tax tables and brackets (TRAIN/CREATE Law).
          </p>
        </div>
        <form action={async () => { "use server"; await createNewTaxTable(); }}>
          <Button type="submit">
            <Plus className="mr-2 h-4 w-4" />
            New Tax Table
          </Button>
        </form>
      </div>

      {taxTables?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">No tax tables configured yet.</p>
            <form action={async () => { "use server"; await initializeDefaultTaxes(); }}>
              <Button type="submit" variant="outline">Initialize Default PH Tax Table</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {taxTables?.map((table) => (
        <Card key={table.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">{table.name}</CardTitle>
              <CardDescription>
                Effective: {new Date(table.effective_from).toLocaleDateString()} 
                {table.effective_to ? ` - ${new Date(table.effective_to).toLocaleDateString()}` : ' - Present'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {table.is_active ? <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
              <form action={toggleTaxTableActive}>
                <input type="hidden" name="id" value={table.id} />
                <input type="hidden" name="is_active" value={table.is_active ? 'true' : 'false'} />
                <Button type="submit" variant="ghost" size="sm" className={table.is_active ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}>
                  <Power className="w-4 h-4 mr-2" />
                  {table.is_active ? 'Disable' : 'Enable'}
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pay Frequency</TableHead>
                  <TableHead>Min Income</TableHead>
                  <TableHead>Max Income</TableHead>
                  <TableHead>Base Tax</TableHead>
                  <TableHead>Excess Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.tax_brackets?.map((bracket: any) => (
                  <TableRow key={bracket.id}>
                    <TableCell>{bracket.pay_frequency}</TableCell>
                    <TableCell>₱{bracket.minimum_income.toLocaleString()}</TableCell>
                    <TableCell>{bracket.maximum_income ? `₱${bracket.maximum_income.toLocaleString()}` : 'And above'}</TableCell>
                    <TableCell>₱{bracket.base_tax.toLocaleString()}</TableCell>
                    <TableCell>{(bracket.excess_rate * 100).toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
                {(!table.tax_brackets || table.tax_brackets.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No brackets defined.</TableCell>
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
