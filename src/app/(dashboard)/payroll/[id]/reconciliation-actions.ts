"use server"

import { runPayrollDiagnostics, ReconciliationResult } from "@/lib/payroll/reconciliation"

export async function getPayrollDiagnostics(payrollRunId: string): Promise<ReconciliationResult> {
  try {
    const result = await runPayrollDiagnostics(payrollRunId)
    return result
  } catch (error: any) {
    console.error("Error running payroll diagnostics:", error)
    // Return a safe fallback with a fake error to block approval if it crashes
    return {
      passedMath: false,
      hasBlockingErrors: true,
      errors: [{
        severity: 'error',
        type: 'MATH_MISMATCH',
        message: 'Failed to run diagnostics engine.',
        reasons: [error.message || 'Unknown error']
      }],
      warnings: [],
      infos: []
    }
  }
}
