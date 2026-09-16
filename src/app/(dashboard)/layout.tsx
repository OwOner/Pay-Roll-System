import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible">
        <AppHeader />
        <main className="flex-1 overflow-y-auto print:overflow-visible p-4 md:p-6 print:p-0 bg-muted/20 print:bg-white">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
