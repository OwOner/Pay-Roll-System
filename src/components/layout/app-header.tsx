import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"

export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 print:hidden">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex flex-1 items-center justify-between">
        <h1 className="text-sm font-medium">Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden md:inline-block">Admin User</span>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
              A
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
