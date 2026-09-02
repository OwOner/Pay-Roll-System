import { createClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { Shield, Users, Mail, Clock, UserPlus, Sparkles, Edit3 } from "lucide-react"

export default async function UsersPage() {
  const supabase = await createClient()

  // Ensure Admin Access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('roles(name)')
    .eq('id', user.id)
    .single()
    
  const roleName = (currentUserProfile?.roles as any)?.name
  if (roleName !== 'Super Admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="relative group">
          <div className="absolute -inset-4 bg-red-500/20 rounded-full blur-xl group-hover:bg-red-500/30 transition-all duration-500"></div>
          <div className="relative bg-gradient-to-b from-white to-red-50 p-6 rounded-full shadow-2xl border border-red-100">
             <Shield className="w-16 h-16 text-red-500" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mt-8 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">Access Denied</h2>
        <p className="text-slate-500 text-center max-w-md text-lg leading-relaxed">
          You do not have permission to view users and roles. <span className="font-semibold text-slate-700">Super Admin</span> access is required.
        </p>
      </div>
    )
  }

  // Fetch all profiles and their roles
  const { data: profiles } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      created_at,
      roles ( id, name, description )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
      {/* Premium Header Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-8 sm:p-12 shadow-2xl shadow-slate-900/20 border border-slate-800">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-orange-500/20 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-blue-500/10 blur-[80px] rounded-full pointer-events-none translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-orange-400 text-sm font-semibold backdrop-blur-md shadow-inner">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="tracking-wide uppercase text-xs">System Administration</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Team <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Management</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl font-medium leading-relaxed">
              Orchestrate access control, assign powerful administrative roles, and oversee your entire organization's user base.
            </p>
          </div>
          <button className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-b from-orange-400 to-orange-600 px-8 py-4 font-bold text-white shadow-[0_0_40px_-10px_rgba(249,115,22,0.5)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_-15px_rgba(249,115,22,0.7)] active:scale-95 border border-orange-300/50">
            <UserPlus className="w-5 h-5 transition-transform group-hover:-rotate-12" />
            <span>Invite New User</span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-pulse"></div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <Card className="bg-white/60 backdrop-blur-3xl rounded-[2rem] border-white/40 shadow-2xl shadow-slate-200/50 overflow-hidden relative ring-1 ring-slate-900/5">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400"></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50/80 backdrop-blur-md text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="px-8 py-6 font-bold uppercase tracking-widest text-[10px] text-slate-400">Member</th>
                <th className="px-8 py-6 font-bold uppercase tracking-widest text-[10px] text-slate-400">Access Level</th>
                <th className="px-8 py-6 font-bold uppercase tracking-widest text-[10px] text-slate-400">Joined</th>
                <th className="px-8 py-6 font-bold uppercase tracking-widest text-[10px] text-slate-400 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {(!profiles || profiles.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                      <div className="bg-slate-50 p-6 rounded-full mb-4 text-slate-300 ring-1 ring-slate-100 shadow-sm">
                        <Users className="w-12 h-12" />
                      </div>
                      <p className="text-slate-900 font-bold text-xl">No team members yet</p>
                      <p className="text-slate-500 mt-2 max-w-sm">Build your dream team by inviting your first user to the platform.</p>
                    </div>
                  </td>
                </tr>
              )}
              {profiles?.map((profile: any) => (
                <tr 
                  key={profile.id} 
                  className="group bg-white hover:bg-slate-50/80 transition-colors duration-300"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-br from-orange-400 to-amber-300 rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
                        <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-white border border-slate-200 flex items-center justify-center text-slate-700 font-black text-lg uppercase shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                          {(profile.full_name || 'U').charAt(0)}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-base mb-1 group-hover:text-orange-600 transition-colors">
                          {profile.full_name || 'Unnamed User'}
                        </div>
                        <div className="text-slate-500 flex items-center gap-1.5 text-sm font-medium">
                          <Mail className="w-4 h-4 text-slate-400" /> 
                          {profile.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {profile.roles ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-100/50 text-orange-700 shadow-sm transition-all group-hover:shadow-md group-hover:bg-orange-100/50 hover:-translate-y-0.5 cursor-default">
                        <Shield className="w-4 h-4 text-orange-500" />
                        <span className="font-bold text-xs">{profile.roles.name}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                        <span className="font-semibold text-xs">No Access</span>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {new Date(profile.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-orange-50 hover:border-orange-200 hover:shadow text-slate-500 hover:text-orange-600 transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

