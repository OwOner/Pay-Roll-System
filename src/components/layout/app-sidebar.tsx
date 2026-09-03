import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboard, Users, Calculator, FileText, Settings, History, Shield, LogOut, Clock, User } from "lucide-react"
import Link from "next/link"
import { logout } from "@/app/(auth)/login/actions"

import { createClient } from "@/lib/supabase/server"

const items = [
  {
    id: "dashboard",
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "employees",
    title: "Employees",
    url: "/employees",
    icon: Users,
  },
  {
    id: "attendance",
    title: "Attendance",
    url: "/attendance",
    icon: Clock,
  },
  {
    id: "payroll",
    title: "Run Payroll",
    url: "/payroll",
    icon: Calculator,
  },
  {
    id: "history",
    title: "Payroll History",
    url: "/history",
    icon: History,
  },
  {
    id: "reports",
    title: "Reports",
    url: "/reports",
    icon: FileText,
  },
  {
    id: "settings",
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    id: "users",
    title: "Users & Roles",
    url: "/users",
    icon: Shield,
  },
]

export async function AppSidebar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let allowedItems = [...items]
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('permissions, roles(name)')
      .eq('id', user.id)
      .single()
      
    if (profile) {
      const isSuperAdmin = (profile?.roles as any)?.name === "Super Admin"
      if (!isSuperAdmin) {
        allowedItems = items.filter(item => {
          // If permissions JSON exists, check if this module is true
          return profile.permissions?.[item.id] === true
        })
      }
    }
  }

  // Always append My Account for authenticated users
  allowedItems.push({
    id: "account",
    title: "My Account",
    url: "/settings/account",
    icon: User,
  })

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <h2 className="text-xl font-bold tracking-tight">Nexus Payroll</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allowedItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    className="w-full"
                    render={
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <form action={logout}>
          <SidebarMenuButton 
            tooltip="Log out" 
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            type="submit"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </SidebarMenuButton>
        </form>
      </SidebarFooter>
    </Sidebar>
  )
}
