"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { updatePassword, updateProfilePicture } from "./actions"
import Image from "next/image"
import { User, Upload, KeyRound } from "lucide-react"

export function AccountForm({ profile, employee }: { profile: any, employee: any }) {
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [avatarMsg, setAvatarMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  async function handlePasswordSubmit(formData: FormData) {
    setPasswordMsg(null)
    const res = await updatePassword(formData)
    if (res.error) setPasswordMsg({ type: 'error', text: res.error })
    else setPasswordMsg({ type: 'success', text: 'Password successfully updated.' })
  }

  async function handleAvatarSubmit(formData: FormData) {
    setAvatarMsg(null)
    const res = await updateProfilePicture(formData)
    if (res.error) setAvatarMsg({ type: 'error', text: res.error })
    else setAvatarMsg({ type: 'success', text: 'Profile picture successfully updated.' })
  }

  return (
    <div className="space-y-6">
      
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>View your basic information. These details are managed by Human Resources.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex items-center gap-6 mb-8">
              {employee?.avatar_url ? (
                <Image src={employee.avatar_url} alt="Avatar" width={80} height={80} className="rounded-full object-cover w-20 h-20 border shadow-sm" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border text-slate-400 shadow-sm">
                  <User className="w-10 h-10" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">{profile.full_name}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                {employee && <p className="text-sm text-muted-foreground mt-1">{employee.positions?.title} • {employee.departments?.name}</p>}
              </div>
           </div>

           <Separator className="my-6" />
           
           <form action={handleAvatarSubmit} className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Upload className="w-4 h-4" /> Change Profile Picture
              </h4>
              
              <div className="flex items-end gap-4 max-w-sm">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="avatar">Select new image</Label>
                  <Input id="avatar" name="avatar" type="file" accept="image/*" required />
                </div>
                <Button type="submit">Upload</Button>
              </div>
              {avatarMsg && (
                <p className={`text-sm ${avatarMsg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                  {avatarMsg.text}
                </p>
              )}
           </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Update your system password here.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handlePasswordSubmit} className="space-y-4 max-w-sm">
             <div className="space-y-2">
               <Label htmlFor="new_password">New Password</Label>
               <Input id="new_password" name="new_password" type="password" required />
             </div>
             <div className="space-y-2">
               <Label htmlFor="confirm_password">Confirm New Password</Label>
               <Input id="confirm_password" name="confirm_password" type="password" required />
             </div>
             <Button type="submit" className="w-full">
               <KeyRound className="w-4 h-4 mr-2" /> Change Password
             </Button>

             {passwordMsg && (
                <p className={`text-sm mt-2 ${passwordMsg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                  {passwordMsg.text}
                </p>
              )}
          </form>
        </CardContent>
      </Card>

    </div>
  )
}
