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
import { LayoutDashboard, Users, Calculator, FileText, Settings, History, Shield, LogOut } from "lucide-react"
import Link from "next/link"
import { logout } from "@/app/(auth)/login/actions"

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Employees",
    url: "/employees",
    icon: Users,
  },
  {
    title: "Run Payroll",
    url: "/payroll",
    icon: Calculator,
  },
  {
    title: "Payroll History",
    url: "/history",
    icon: History,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileText,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Users & Roles",
    url: "/users",
    icon: Shield,
  },
]

export function AppSidebar() {
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
              {items.map((item) => (
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
