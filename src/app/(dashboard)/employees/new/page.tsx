import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { NewEmployeeForm } from "./new-employee-form"
import { createClient } from "@/lib/supabase/server"

export default async function NewEmployeePage() {
  const supabase = await createClient()
  
  const { data: departments } = await supabase.from('departments').select('id, name').eq('is_active', true).order('name')
  const { data: positions } = await supabase.from('positions').select('id, title, department_id').eq('is_active', true).order('title')

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Add New Employee</h2>
          <p className="text-sm text-muted-foreground">
            Enter the details for the new employee record.
          </p>
        </div>
        <Link href="/employees">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <NewEmployeeForm departments={departments || []} positions={positions || []} />
        </CardContent>
      </Card>
    </div>
  )
}
