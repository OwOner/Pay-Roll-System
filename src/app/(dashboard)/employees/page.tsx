import { createClient, authorizeModule } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default async function EmployeesPage() {
  await authorizeModule('employees')
  const supabase = await createClient()
  
  // Fetch employees and their departments/positions
  const { data: employees } = await supabase
    .from('employees')
    .select(`
      *,
      departments(name),
      positions(title),
      employee_compensation_history(id, effective_to)
    `)
    .order('last_name', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Employees</h2>
          <p className="text-sm text-muted-foreground">
            Manage your workforce directory and profiles.
          </p>
        </div>
        <Link href="/employees/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search employees..."
                className="pl-8"
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Salary Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees && employees.length > 0 ? (
                employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="font-medium">{emp.last_name}, {emp.first_name} {emp.middle_name?.charAt(0)}.</div>
                      <div className="text-xs text-muted-foreground">{emp.email}</div>
                    </TableCell>
                    <TableCell>{emp.employee_code}</TableCell>
                    <TableCell>{emp.departments?.name || '-'}</TableCell>
                    <TableCell>{emp.positions?.title || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={emp.employment_status === 'Active' ? 'default' : 'secondary'}>
                        {emp.employment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {emp.employee_compensation_history && emp.employee_compensation_history.some((c: any) => !c.effective_to || new Date(c.effective_to) > new Date()) ? (
                        <div className="flex items-center text-green-600 text-sm">
                          <span className="mr-1">✓</span> Salary Set
                        </div>
                      ) : (
                        <Link href={`/employees/${emp.id}?tab=compensation`}>
                          <div className="flex items-center text-amber-600 font-medium text-sm hover:underline cursor-pointer">
                            <span className="mr-1">⚠</span> Salary Not Set
                          </div>
                        </Link>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/employees/${emp.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No employees found.
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
