import { createClient } from "@/lib/supabase/server"
import OrganizationClient from "./organization-client"

export default async function OrganizationPage() {
  const supabase = await createClient()

  const { data: departments } = await supabase
    .from('departments')
    .select('*')
    .eq('is_active', true)
    .order('name')

  const { data: positions } = await supabase
    .from('positions')
    .select(`
      *,
      departments(name),
      work_policies(name)
    `)
    .eq('is_active', true)
    .order('title')

  const { data: workPolicies } = await supabase
    .from('work_policies')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Organization Structure</h3>
        <p className="text-sm text-muted-foreground">
          Manage your company's departments and job positions.
        </p>
      </div>
      <OrganizationClient 
        initialDepartments={departments || []} 
        initialPositions={positions || []}
        workPolicies={workPolicies || []}
      />
    </div>
  )
}
