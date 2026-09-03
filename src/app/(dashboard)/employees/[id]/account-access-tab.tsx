"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export function AccountAccessTab({ employee, profile }: { employee: any, profile: any }) {
  const hasAccount = !!profile

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Account</CardTitle>
          <CardDescription>Manage Nexus login and access for this employee.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasAccount ? (
            <>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-700">Account exists</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Email</div>
                  <div>{profile.email}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Role ID</div>
                  <div>{profile.role_id}</div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-medium">Module Permissions</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  {["dashboard", "employees", "attendance", "leave", "payroll", "history", "reports", "settings", "users", "audit"].map(module => (
                    <div key={module} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`perm_${module}`} 
                        checked={profile.permissions?.[module] === true}
                        disabled
                      />
                      <Label htmlFor={`perm_${module}`} className="font-normal capitalize">{module.replace('_', ' ')}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline">Edit Permissions (Coming Soon)</Button>
                <Button variant="destructive">Suspend Account</Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium">No Account Provisioned</p>
                <p className="text-sm text-muted-foreground max-w-sm">This employee exists in Nexus but does not have login access.</p>
              </div>
              <Button>Provision System Account</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
