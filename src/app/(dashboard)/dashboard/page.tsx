import { Card, CardContent } from "@/components/ui/card"
import { Users, Banknote, Landmark, AlertCircle, ArrowUpRight, TrendingUp, Sparkles, Activity } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Run all independent queries concurrently to prevent waterfall delays
  const [
    { count: activeEmployeesCount },
    { count: pendingPayrollsCount },
    { data: recentRuns }
  ] = await Promise.all([
    // 1. Fetch Active Employees
    supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('employment_status', 'Active'),
      
    // 2. Fetch Payroll Runs for 'Pending Approval'
    supabase
      .from('payroll_runs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Pending Approval'),
      
    // 3. Fetch Completed Payroll Runs for list
    supabase
      .from('payroll_runs')
      .select(`
        id,
        status,
        payroll_periods ( period_start, period_end ),
        payroll_items ( gross_pay, net_pay )
      `)
      .in('status', ['Paid', 'Completed', 'Approved'])
      .order('created_at', { ascending: false })
      .limit(3)
  ])

  // Calculate totals from recent runs
  let totalGross = 0;
  let totalNet = 0;
  
  if (recentRuns) {
    recentRuns.forEach(run => {
      run.payroll_items?.forEach((item: any) => {
        totalGross += Number(item.gross_pay || 0);
        totalNet += Number(item.net_pay || 0);
      });
    });
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
      {/* Premium Header Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-8 sm:p-10 shadow-2xl shadow-slate-900/20 border border-slate-800">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute -top-32 -right-32 w-[30rem] h-[30rem] bg-orange-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-[20rem] h-[20rem] bg-blue-500/15 blur-[80px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-orange-400 text-sm font-semibold backdrop-blur-md shadow-inner self-start">
            <Activity className="w-4 h-4 animate-pulse" />
            <span className="tracking-wide uppercase text-xs">Live Overview</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">
            Welcome back to your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Workspace</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl font-medium">
            Here's everything happening with your payroll and workforce today. Stay on top of approvals and recent runs.
          </p>
        </div>
      </div>

      {/* Metric Widgets */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Total Employees */}
        <Card className="group relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-[2rem] border-white/40 shadow-xl shadow-slate-200/50 p-6 ring-1 ring-slate-900/5 hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Employees</h3>
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200/50 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div>
              <div className="text-4xl font-black text-slate-900 tracking-tight">{activeEmployeesCount || 0}</div>
              <div className="flex items-center gap-1.5 mt-2 text-sm text-emerald-600 font-semibold">
                <ArrowUpRight className="h-4 w-4" />
                <span>Real-time count</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Gross Payroll */}
        <Card className="group relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-[2rem] border-white/40 shadow-xl shadow-slate-200/50 p-6 ring-1 ring-slate-900/5 hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gross Payroll</h3>
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200/50 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Banknote className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <div className="text-4xl font-black text-slate-900 tracking-tight">{formatCurrency(totalGross)}</div>
              <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-500 font-medium">
                <span>{totalGross > 0 ? 'Across recent runs' : 'Waiting for first run'}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Net Payroll */}
        <Card className="group relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-[2rem] border-white/40 shadow-xl shadow-slate-200/50 p-6 ring-1 ring-slate-900/5 hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Net Payroll</h3>
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200/50 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Landmark className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div>
              <div className="text-4xl font-black text-slate-900 tracking-tight">{formatCurrency(totalNet)}</div>
              <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-500 font-medium">
                <span>{totalNet > 0 ? 'Across recent runs' : 'Waiting for first run'}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Pending Approval */}
        <Card className="group relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-[2rem] border-white/40 shadow-xl shadow-slate-200/50 p-6 ring-1 ring-slate-900/5 hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-500/10 blur-2xl rounded-full group-hover:bg-red-500/20 transition-all duration-500"></div>
          <div className="relative flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Approvals</h3>
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 border border-red-200/50 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div>
              <div className="text-4xl font-black text-slate-900 tracking-tight">{pendingPayrollsCount || 0}</div>
              <div className="flex items-center gap-1.5 mt-2 text-sm text-red-500 font-semibold">
                <Sparkles className="h-4 w-4" />
                <span>Requires attention</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 bg-white/60 backdrop-blur-3xl rounded-[2rem] border-white/40 shadow-2xl shadow-slate-200/50 p-6 relative overflow-hidden ring-1 ring-slate-900/5">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400"></div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Recent Payroll Runs</h3>
              <p className="text-sm text-slate-500 mt-1">Overview of your most recently processed payrolls.</p>
            </div>
            <button className="text-sm font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-xl transition-colors ring-1 ring-orange-200/50">
              View All
            </button>
          </div>
          
          <div className="rounded-2xl border border-slate-200/60 overflow-hidden bg-white/40 shadow-inner">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50/80 backdrop-blur-md text-slate-500 border-b border-slate-200/60">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Period</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Type</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Net Total</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(!recentRuns || recentRuns.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No completed payroll runs yet.
                    </td>
                  </tr>
                )}
                {recentRuns?.map((run: any) => {
                  const runNetTotal = run.payroll_items?.reduce((sum: number, item: any) => sum + Number(item.net_pay || 0), 0) || 0;
                  return (
                    <tr key={run.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                        {new Date(run.payroll_periods.period_start).toLocaleDateString()} - {new Date(run.payroll_periods.period_end).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">Regular</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(runNetTotal)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/80 text-emerald-700 border border-emerald-200 shadow-sm">
                          {run.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Side Widget */}
        <Card className="bg-white/60 backdrop-blur-3xl rounded-[2rem] border-white/40 shadow-2xl shadow-slate-200/50 p-6 flex flex-col ring-1 ring-slate-900/5">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Quick Actions</h3>
          <p className="text-sm text-slate-500 mb-6">Common tasks to get you started quickly.</p>
          
          <div className="flex flex-col gap-4">
            <Link href="/payroll/run" className="relative flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:border-orange-300 hover:shadow-md hover:shadow-orange-500/10 transition-all duration-300 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-orange-100/50 text-orange-600 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Run Payroll</span>
              </div>
              <div className="relative w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-orange-100 transition-colors">
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 transition-colors" />
              </div>
            </Link>
            
            <Link href="/employees/new" className="relative flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-300 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-blue-100/50 text-blue-600 group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5" />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Add Employee</span>
              </div>
              <div className="relative w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-blue-100 transition-colors">
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </Link>
            
            <Link href="/leave" className="relative flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-500/10 transition-all duration-300 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-emerald-100/50 text-emerald-600 group-hover:scale-110 transition-transform">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Review Leaves</span>
              </div>
              <div className="relative w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-emerald-100 transition-colors">
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
