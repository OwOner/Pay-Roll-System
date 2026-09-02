import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { initializeSSS, initializePhilHealth, initializePagIBIG } from "./actions"

export default async function ContributionsSettingsPage() {
  const supabase = await createClient()
  const { data: tables } = await supabase
    .from('government_contribution_tables')
    .select('*, government_contribution_brackets(*)')
    .order('effective_from', { ascending: false })

  const sssTables = tables?.filter(t => t.contribution_type === 'SSS') || []
  const phTables = tables?.filter(t => t.contribution_type === 'PhilHealth') || []
  const pagibigTables = tables?.filter(t => t.contribution_type === 'Pag-IBIG') || []

  const renderTable = (tableList: any[], type: string) => {
    if (tableList.length === 0) {
      return (
        <Card className="mt-4">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">No configuration found.</p>
            {type === 'SSS' && (
              <form action={async (_fd) => { "use server"; await initializeSSS(); }}><Button type="submit" variant="outline">Initialize SSS 2025</Button></form>
            )}
            {type === 'PhilHealth' && (
              <form action={async (_fd) => { "use server"; await initializePhilHealth(); }}><Button type="submit" variant="outline">Initialize PhilHealth</Button></form>
            )}
            {type === 'Pag-IBIG' && (
              <form action={async (_fd) => { "use server"; await initializePagIBIG(); }}><Button type="submit" variant="outline">Initialize Pag-IBIG</Button></form>
            )}
          </CardContent>
        </Card>
      )
    }

    return tableList.map((table) => (
      <Card key={table.id} className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">{table.name}</CardTitle>
            <CardDescription>
              Effective: {new Date(table.effective_from).toLocaleDateString()}
            </CardDescription>
          </div>
          {table.is_active && <Badge>Active</Badge>}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Salary Range</TableHead>
                <TableHead>Employee Share</TableHead>
                <TableHead>Employer Share</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.government_contribution_brackets?.map((bracket: any) => {
                const empShare = bracket.employee_amount > 0 ? `₱${bracket.employee_amount}` : `${bracket.employee_rate * 100}%`
                const erShare = bracket.employer_amount > 0 ? `₱${bracket.employer_amount}` : `${bracket.employer_rate * 100}%`
                return (
                  <TableRow key={bracket.id}>
                    <TableCell>
                      ₱{bracket.salary_min.toLocaleString()} - {bracket.salary_max ? `₱${bracket.salary_max.toLocaleString()}` : 'MAX'}
                    </TableCell>
                    <TableCell>{empShare}</TableCell>
                    <TableCell>{erShare}</TableCell>
                    <TableCell>
                      {bracket.employee_amount > 0 && bracket.employer_amount > 0 
                        ? `₱${(bracket.employee_amount + bracket.employer_amount).toLocaleString()}` 
                        : '-'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Government Contributions</h3>
          <p className="text-sm text-muted-foreground">
            Manage SSS, PhilHealth, and Pag-IBIG matrices.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Table
        </Button>
      </div>

      <Tabs defaultValue="sss" className="w-full">
        <TabsList>
          <TabsTrigger value="sss">SSS</TabsTrigger>
          <TabsTrigger value="philhealth">PhilHealth</TabsTrigger>
          <TabsTrigger value="pagibig">Pag-IBIG</TabsTrigger>
        </TabsList>
        <TabsContent value="sss">
          {renderTable(sssTables, 'SSS')}
        </TabsContent>
        <TabsContent value="philhealth">
          {renderTable(phTables, 'PhilHealth')}
        </TabsContent>
        <TabsContent value="pagibig">
          {renderTable(pagibigTables, 'Pag-IBIG')}
        </TabsContent>
      </Tabs>
    </div>
  )
}
