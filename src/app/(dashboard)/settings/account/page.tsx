import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AccountForm } from "./account-form"

export default async function AccountSettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      employees (
        id,
        avatar_url,
        positions (title),
        departments (name)
      )
    `)
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Account</h2>
        <p className="text-sm text-muted-foreground">
          Manage your personal account settings and security.
        </p>
      </div>

      <AccountForm profile={profile} employee={profile?.employees} />
    </div>
  )
}
