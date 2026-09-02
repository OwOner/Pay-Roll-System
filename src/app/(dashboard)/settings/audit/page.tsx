import { createClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { Shield, Search } from "lucide-react"

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const supabase = await createClient()

  // Ensure Admin Access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('roles(name)').eq('id', user.id).single()
  const roleName = (profile?.roles as any)?.name
  if (roleName !== 'Super Admin') {
    return (
      <div className="p-8 text-center text-slate-500">
        You do not have permission to view audit logs. Super Admin access required.
      </div>
    )
  }

  // Fetch Audit Logs
  let query = supabase
    .from('audit_logs')
    .select(`
      id,
      action,
      entity_type,
      entity_id,
      reason,
      created_at,
      profiles:user_id ( first_name, last_name, role )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (q) {
    query = query.or(`action.ilike.%${q}%,entity_type.ilike.%${q}%,reason.ilike.%${q}%`)
  }

  const { data: logs } = await query

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-8 h-8 text-indigo-600" /> Audit Logs
          </h2>
          <p className="text-slate-500">Immutable record of sensitive mutations and actions.</p>
        </div>
      </div>

      <Card className="bg-white rounded-xl border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
          <form className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              name="q"
              defaultValue={q || ""}
              placeholder="Search actions, entities, or reasons..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </form>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 font-medium">Timestamp</th>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Action</th>
                <th className="px-6 py-3 font-medium">Entity Type</th>
                <th className="px-6 py-3 font-medium">Reason / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!logs || logs.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No audit logs found.
                  </td>
                </tr>
              )}
              {logs?.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{log.profiles?.first_name} {log.profiles?.last_name}</div>
                    <div className="text-xs text-slate-500">{log.profiles?.role}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {log.entity_type}
                    <div className="text-xs text-slate-400 max-w-[120px] truncate" title={log.entity_id}>{log.entity_id}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {log.reason || "-"}
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
