import { getWorkPolicies } from "./actions"
import { WorkPoliciesClient } from "./work-policies-client"

export default async function WorkPoliciesPage() {
  const policies = await getWorkPolicies()

  return <WorkPoliciesClient initialPolicies={policies ?? []} />
}
