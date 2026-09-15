import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6 pb-16 md:block">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your company settings, tax tables, and payroll configurations.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            <Link
              href="/settings/account"
              className="inline-flex h-9 items-center justify-start rounded-md px-4 py-2 text-sm font-medium hover:bg-muted hover:text-accent-foreground"
            >
              Account
            </Link>
            <Link
              href="/settings/company"
              className="inline-flex h-9 items-center justify-start rounded-md px-4 py-2 text-sm font-medium hover:bg-muted hover:text-accent-foreground"
            >
              Company Settings
            </Link>
            <Link
              href="/settings/tax"
              className="inline-flex h-9 items-center justify-start rounded-md px-4 py-2 text-sm font-medium hover:bg-muted hover:text-accent-foreground"
            >
              Tax Tables
            </Link>
            <Link
              href="/settings/organization"
              className="inline-flex h-9 items-center justify-start rounded-md px-4 py-2 text-sm font-medium hover:bg-muted hover:text-accent-foreground"
            >
              Organization
            </Link>
            <Link
              href="/settings/work-policies"
              className="inline-flex h-9 items-center justify-start rounded-md px-4 py-2 text-sm font-medium hover:bg-muted hover:text-accent-foreground"
            >
              Work Policies
            </Link>
            <Link
              href="/settings/contributions"
              className="inline-flex h-9 items-center justify-start rounded-md px-4 py-2 text-sm font-medium hover:bg-muted hover:text-accent-foreground"
            >
              Contributions
            </Link>
            <Link
              href="/settings/statutory-schedules"
              className="inline-flex h-9 items-center justify-start rounded-md px-4 py-2 text-sm font-medium hover:bg-muted hover:text-accent-foreground"
            >
              Statutory Schedules
            </Link>
            <Link
              href="/settings/holidays"
              className="inline-flex h-9 items-center justify-start rounded-md px-4 py-2 text-sm font-medium hover:bg-muted hover:text-accent-foreground"
            >
              Holidays
            </Link>
          </nav>
        </aside>
        <div className="flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  )
}
