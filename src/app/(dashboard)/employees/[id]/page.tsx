import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, ArrowLeft, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { UpdateCompensationDialog } from "./update-compensation-dialog"
import { AccountAccessTab } from "./account-access-tab"

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // For prototype, we might not have a valid UUID if they click a placeholder.
  // We should fetch the employee, but if the ID is not valid UUID, it will throw.
  // But wait, the list is fetched from DB, so ID is valid.
  
  const { data: employee, error } = await supabase
    .from('employees')
    .select(`
      *,
      departments(name),
      positions(title),
      employee_compensation_history(*),
      profiles(*)
    `)
    .eq('id', id)
    .single()

  if (error || !employee) {
    return notFound()
  }

  const compensationHistory = employee.employee_compensation_history || []
  const activeCompensation = compensationHistory.find((c: any) => !c.effective_to)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/employees">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              {employee.avatar_url ? (
                <Image src={employee.avatar_url} alt={employee.first_name} width={40} height={40} className="rounded-full object-cover w-10 h-10 border" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border text-slate-500">
                  <User className="w-5 h-5" />
                </div>
              )}
              {employee.first_name} {employee.last_name}
            </h2>
            <div className="flex items-center gap-2 mt-1 ml-13">
              <Badge variant={employee.employment_status === 'Active' ? 'default' : 'secondary'}>
                {employee.employment_status}
              </Badge>
              <span className="text-sm text-muted-foreground">{employee.employee_code}</span>
            </div>
          </div>
        </div>
        <Link href={`/employees/${id}/edit`}>
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compensation">Compensation</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="payroll_history">Payroll History</TabsTrigger>
          <TabsTrigger value="account">Account & Access</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Full Name</div>
                    <div>{employee.first_name} {employee.middle_name} {employee.last_name}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Email</div>
                    <div>{employee.email || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Phone</div>
                    <div>{employee.phone || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Birth Date</div>
                    <div>{employee.birth_date ? new Date(employee.birth_date).toLocaleDateString() : '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Gender</div>
                    <div>{employee.gender || '-'}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm font-medium text-muted-foreground">Location</div>
                    <div>{employee.location || '-'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Department</div>
                    <div>{employee.departments?.name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Position</div>
                    <div>{employee.positions?.title || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Date Hired</div>
                    <div>{new Date(employee.date_hired).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Employment Type</div>
                    <div>{employee.employment_type}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Government Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">SSS</div>
                    <div>{employee.sss_number || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">PhilHealth</div>
                    <div>{employee.philhealth_number || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Pag-IBIG</div>
                    <div>{employee.pagibig_number || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">TIN</div>
                    <div>{employee.tin_number || '-'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compensation" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Compensation History</CardTitle>
                <CardDescription>Salary and rate changes over time.</CardDescription>
              </div>
              <UpdateCompensationDialog employeeId={employee.id} />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Salary Type</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Daily Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compensationHistory.length > 0 ? (
                    compensationHistory.sort((a: any, b: any) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime()).map((comp: any) => (
                      <TableRow key={comp.id}>
                        <TableCell>{new Date(comp.effective_from).toLocaleDateString()}</TableCell>
                        <TableCell>{comp.effective_to ? new Date(comp.effective_to).toLocaleDateString() : 'Present'}</TableCell>
                        <TableCell>{comp.salary_type}</TableCell>
                        <TableCell>{comp.pay_frequency}</TableCell>
                        <TableCell className="text-right font-medium">₱{comp.basic_salary.toLocaleString()}</TableCell>
                        <TableCell className="text-right">₱{comp.daily_rate ? comp.daily_rate.toLocaleString() : '-'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No compensation history recorded.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="attendance" className="mt-6">
           <Card>
             <CardHeader>
               <CardTitle>Attendance Records</CardTitle>
               <CardDescription>Daily time records and history.</CardDescription>
             </CardHeader>
             <CardContent className="py-8 text-center text-muted-foreground">
               Attendance records will appear here.
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="leave" className="mt-6">
           <Card>
             <CardHeader>
               <CardTitle>Leave Balances & History</CardTitle>
               <CardDescription>Current available leave credits.</CardDescription>
             </CardHeader>
             <CardContent className="py-8 text-center text-muted-foreground">
               Leave balance feature coming soon.
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="payroll_history" className="mt-6">
           <Card>
             <CardHeader>
               <CardTitle>Payslips</CardTitle>
               <CardDescription>Past payroll records.</CardDescription>
             </CardHeader>
             <CardContent className="py-8 text-center text-muted-foreground">
               Payroll history will appear here.
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <AccountAccessTab employee={employee} profile={employee.profiles?.[0]} />
        </TabsContent>

      </Tabs>
    </div>
  )
}
