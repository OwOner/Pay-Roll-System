import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

import { revalidatePath } from "next/cache"

export default async function CompanySettingsPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase.from('company_settings').select('*').single()

  async function saveSettings(formData: FormData) {
    "use server"
    const supabaseServer = await createClient()
    const updates = {
      company_name: formData.get("company_name"),
      tin: formData.get("tin"),
      address: formData.get("address"),
      email: formData.get("email"),
      phone: formData.get("phone")
    }

    if (settings?.id) {
      await supabaseServer.from("company_settings").update(updates).eq("id", settings.id)
    } else {
      await supabaseServer.from("company_settings").insert(updates)
    }
    
    revalidatePath("/settings")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Details</CardTitle>
        <CardDescription>
          Update your company's official information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={saveSettings} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input id="company_name" name="company_name" defaultValue={settings?.company_name || ""} placeholder="Nexus Corporation" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tin">TIN (Tax Identification Number)</Label>
            <Input id="tin" name="tin" defaultValue={settings?.tin || ""} placeholder="000-123-456-000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={settings?.address || ""} placeholder="123 Business Blvd, Manila" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={settings?.email || ""} placeholder="hr@nexus.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={settings?.phone || ""} placeholder="+63 2 8123 4567" />
            </div>
          </div>
          <Button type="submit">Save Settings</Button>
        </form>
      </CardContent>
    </Card>
  )
}
