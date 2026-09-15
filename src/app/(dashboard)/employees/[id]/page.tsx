import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, ArrowLeft, User, Mail, Phone, MapPin, Calendar, Briefcase, FileText, Building2, CreditCard } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { UpdateCompensationDialog } from "./update-compensation-dialog"
import { AccountAccessTab } from "./account-access-tab"
import { EmployeeAttendanceTab } from "./employee-attendance-tab"
import { EmployeeWorkPolicyTab } from "./employee-work-policy-tab"
import { ExemptToggle } from "./exempt-toggle"
import { CashAdvancesTab } from "./cash-advances-tab"

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: employee, error } = await supabase
    .from('employees')
    .select(`
      *,
      departments(name),
      positions(title, default_work_policy_id),
      employee_compensation_history(*),
      profiles(*),
      employee_work_policies(
        *,
        work_policies(*)
      ),
      cash_advances(*)
    `)
    .eq('id', id)
    .single()

  if (error || !employee) {
    return notFound()
  }

  const compensationHistory = employee.employee_compensation_history || []
  const activeCompensation = compensationHistory.find((c: any) => !c.effective_to)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/employees">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 -ml-3">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Directory
          </Button>
        </Link>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="h-32 sm:h-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 w-full"></div>
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-12 sm:-mt-16 mb-6 gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
              {employee.avatar_url ? (
                <Image src={employee.avatar_url} alt={employee.first_name} width={128} height={128} className="rounded-2xl border-4 border-white object-cover w-24 h-24 sm:w-32 sm:h-32 shadow-md bg-white" />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-white bg-slate-50 flex items-center justify-center text-slate-300 shadow-md">
                  <User className="w-12 h-12" />
                </div>
              )}
              <div className="text-center sm:text-left mb-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {employee.first_name} {employee.last_name}
                </h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                  <Badge variant={employee.employment_status === 'Active' ? 'default' : 'secondary'} className={employee.employment_status === 'Active' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : ''}>
                    {employee.employment_status}
                  </Badge>
                  <span className="text-sm font-medium text-slate-500">{employee.positions?.title || 'No Position Assigned'}</span>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{employee.employee_code}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Link href={`/employees/${id}/edit`} className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto shadow-sm">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Quick stats / contact info row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-medium text-slate-500">Email Address</div>
                <div className="text-sm font-semibold text-slate-900 truncate" title={employee.email}>{employee.email || '-'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-medium text-slate-500">Phone Number</div>
                <div className="text-sm font-semibold text-slate-900 truncate">{employee.phone || '-'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-medium text-slate-500">Location</div>
                <div className="text-sm font-semibold text-slate-900 truncate" title={employee.location}>{employee.location || '-'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-medium text-slate-500">Date Hired</div>
                <div className="text-sm font-semibold text-slate-900">{new Date(employee.date_hired).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList variant="line" className="w-full justify-start border-b border-slate-200 mb-6 overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compensation">Compensation</TabsTrigger>
          <TabsTrigger value="work_policy">Work Policy</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="cash_advances">Cash Advances</TabsTrigger>
          <TabsTrigger value="payroll_history">Payroll History</TabsTrigger>
          <TabsTrigger value="account">Account & Access</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-slate-400" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Full Name</div>
                    <div className="font-medium text-slate-900">{employee.first_name} {employee.middle_name} {employee.last_name}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Birth Date</div>
                    <div className="font-medium text-slate-900">{employee.birth_date ? new Date(employee.birth_date).toLocaleDateString() : '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Gender</div>
                    <div className="font-medium text-slate-900">{employee.gender || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Civil Status</div>
                    <div className="font-medium text-slate-900">{employee.civil_status || '-'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-slate-400" />
                  Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Department</div>
                    <div className="font-medium text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      {employee.departments?.name || 'Unassigned'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Employment Type</div>
                    <div className="font-medium text-slate-900">{employee.employment_type}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Shift Schedule</div>
                    <div className="font-medium text-slate-900">{employee.shift_schedule || 'Standard (9AM-6PM)'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Payroll Status</div>
                    <div className="mt-1">
                      <ExemptToggle employeeId={employee.id} initialExempt={employee.is_payroll_exempt || false} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 shadow-sm border-slate-200">
              <CardHeader className="pb-4 border-b border-slate-100 mb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-400" />
                  Government Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">SSS</div>
                    <div className="font-mono text-slate-900">{employee.sss_number || 'Not Provided'}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">PhilHealth</div>
                    <div className="font-mono text-slate-900">{employee.philhealth_number || 'Not Provided'}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Pag-IBIG</div>
                    <div className="font-mono text-slate-900">{employee.pagibig_number || 'Not Provided'}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-1">TIN</div>
                    <div className="font-mono text-slate-900">{employee.tin_number || 'Not Provided'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compensation" className="mt-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-100">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-slate-400" />
                  Compensation History
                </CardTitle>
                <CardDescription className="mt-1">Salary and rate changes over time.</CardDescription>
              </div>
              <UpdateCompensationDialog employeeId={employee.id} />
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Salary Basis</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead>Pay Frequency</TableHead>
                    <TableHead className="pl-6">Effective From</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compensationHistory.length > 0 ? (
                    compensationHistory.sort((a: any, b: any) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime()).map((comp: any) => (
                      <TableRow key={comp.id} className="hover:bg-slate-50">
                        <TableCell>
                          {comp.salary_basis ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {comp.salary_basis}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              ⚠ Needs Review
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          {comp.salary_basis === 'Daily'   && comp.daily_rate   ? `₱${Number(comp.daily_rate).toLocaleString()}/day` : ''}
                          {comp.salary_basis === 'Weekly'  && comp.weekly_rate  ? `₱${Number(comp.weekly_rate).toLocaleString()}/wk` : ''}
                          {comp.salary_basis === 'Hourly'  && comp.hourly_rate  ? `₱${Number(comp.hourly_rate).toLocaleString()}/hr` : ''}
                          {(comp.salary_basis === 'Monthly' || !comp.salary_basis) ? `₱${Number(comp.basic_salary).toLocaleString()}/mo` : ''}
                        </TableCell>
                        <TableCell>{comp.pay_frequency}</TableCell>
                        <TableCell className="pl-6 font-medium text-slate-900">{new Date(comp.effective_from).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {comp.effective_to ? (
                            <span className="text-slate-500 text-sm">Ended on {new Date(comp.effective_to).toLocaleDateString()}</span>
                          ) : (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200">Current</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                        <CreditCard className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                        No compensation history recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="work_policy" className="mt-6">
          <EmployeeWorkPolicyTab employee={employee} />
        </TabsContent>
        
        <TabsContent value="attendance" className="mt-6">
           <EmployeeAttendanceTab employee={employee} />
        </TabsContent>

        <TabsContent value="leave" className="mt-6">
           <Card className="shadow-sm border-slate-200">
             <CardHeader>
               <CardTitle className="text-lg">Leave Balances & History</CardTitle>
               <CardDescription>Current available leave credits.</CardDescription>
             </CardHeader>
             <CardContent className="py-12 text-center text-slate-500">
               <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-3" />
               Leave balance feature coming soon.
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="cash_advances" className="mt-6">
          <CashAdvancesTab employeeId={employee.id} cashAdvances={employee.cash_advances || []} />
        </TabsContent>

        <TabsContent value="payroll_history" className="mt-6">
           <Card className="shadow-sm border-slate-200">
             <CardHeader>
               <CardTitle className="text-lg">Payslips</CardTitle>
               <CardDescription>Past payroll records.</CardDescription>
             </CardHeader>
             <CardContent className="py-12 text-center text-slate-500">
               <FileText className="w-8 h-8 mx-auto text-slate-300 mb-3" />
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
