import { checkStatutoryConfiguration } from "./actions"
import { AlertCircle, ArrowRight } from "lucide-react"
import StatutoryConfigClient from "./statutory-config-client"

export default async function StatutoryWarningBlock({ 
  runId, 
  periodId,
  frequency,
  periodStart,
  periodEnd
}: { 
  runId: string, 
  periodId: string,
  frequency: string,
  periodStart: string,
  periodEnd: string
}) {
  const check = await checkStatutoryConfiguration(runId)

  if (!check.success || !check.pending) {
    return null
  }

  const { eligibleEmployeesCount, breakdown } = check

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-orange-600 shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-orange-900 mb-2">⚠️ Deduction setup needed</h3>
          <p className="text-orange-800 mb-4">
            <strong>{eligibleEmployeesCount} {eligibleEmployeesCount === 1 ? 'employee is' : 'employees are'}</strong> configured for statutory deductions:
          </p>
          <ul className="list-disc pl-5 text-orange-800 space-y-1 mb-6 font-medium">
            <li>SSS · {breakdown?.sss || 0} {(breakdown?.sss || 0) === 1 ? 'employee' : 'employees'}</li>
            <li>PhilHealth · {breakdown?.philhealth || 0} {(breakdown?.philhealth || 0) === 1 ? 'employee' : 'employees'}</li>
            <li>Pag-IBIG · {breakdown?.pagibig || 0} {(breakdown?.pagibig || 0) === 1 ? 'employee' : 'employees'}</li>
          </ul>
          
          <p className="text-orange-800 mb-6 font-medium">
            Configure the deduction schedule before approving this payroll.
          </p>

          <StatutoryConfigClient 
            periodId={periodId} 
            frequency={frequency} 
            periodStart={periodStart} 
            periodEnd={periodEnd} 
          />
        </div>
      </div>
    </div>
  )
}
