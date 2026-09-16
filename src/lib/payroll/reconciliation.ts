import { createClient } from "@/lib/supabase/server";
import Decimal from "decimal.js";

export type DiagnosticSeverity = 'error' | 'warning' | 'info';
export type DiagnosticType = 
  | 'MATH_MISMATCH' 
  | 'NEGATIVE_NET_PAY'
  | 'DUPLICATE_EMPLOYEE'
  | 'MISSING_TIMESHEET'
  | 'NET_PAY_VARIANCE'
  | 'GROSS_PAY_VARIANCE'
  | 'MISSING_EMPLOYEE'
  | 'NEW_EMPLOYEE'
  | 'ZERO_NET_PAY'
  | 'MISSING_ATTENDANCE';

export interface DiagnosticIssue {
  severity: DiagnosticSeverity;
  type: DiagnosticType;
  employeeId?: string;
  employeeName?: string;
  currentValue?: number;
  previousValue?: number;
  absoluteVariance?: number;
  percentageVariance?: number;
  message: string;
  reasons: string[];
}

export interface ReconciliationResult {
  passedMath: boolean;
  errors: DiagnosticIssue[];
  warnings: DiagnosticIssue[];
  infos: DiagnosticIssue[];
  hasBlockingErrors: boolean;
}

export async function runPayrollDiagnostics(payrollRunId: string): Promise<ReconciliationResult> {
  const supabase = await createClient();

  const issues: DiagnosticIssue[] = [];

  // 1. Fetch Current Run & Items
  const { data: currentRun, error: runError } = await supabase
    .from('payroll_runs')
    .select(`
      id,
      payroll_periods ( id, period_start, period_end, pay_frequency )
    `)
    .eq('id', payrollRunId)
    .single();

  if (runError || !currentRun) {
    throw new Error("Cannot find payroll run for diagnostics.");
  }

  const { data: currentItems } = await supabase
    .from('payroll_items')
    .select(`
      id, employee_id, gross_pay, total_deductions, net_pay,
      employees ( first_name, last_name, employee_code, employment_status )
    `)
    .eq('payroll_run_id', payrollRunId);

  const items = currentItems || [];

  // 2. Mathematical Integrity (Errors)
  let sumGross = new Decimal(0);
  let sumDed = new Decimal(0);
  let sumNet = new Decimal(0);
  const employeeSeen = new Set<string>();

  for (const item of items) {
    const empName = `${(item.employees as any)?.first_name} ${(item.employees as any)?.last_name}`;
    const empId = item.employee_id;
    
    const gross = new Decimal(item.gross_pay);
    const ded = new Decimal(item.total_deductions);
    const net = new Decimal(item.net_pay);

    // Duplicate check
    if (employeeSeen.has(empId)) {
      issues.push({
        severity: 'error',
        type: 'DUPLICATE_EMPLOYEE',
        employeeId: empId,
        employeeName: empName,
        message: 'Employee appears twice in the same payroll run.',
        reasons: ['Database integrity issue']
      });
    }
    employeeSeen.add(empId);

    // Negative net pay check
    if (net.lessThan(0)) {
      issues.push({
        severity: 'error',
        type: 'NEGATIVE_NET_PAY',
        employeeId: empId,
        employeeName: empName,
        currentValue: net.toNumber(),
        message: `Employee has negative net pay of ₱${net.toNumber().toLocaleString(undefined, {minimumFractionDigits: 2})}.`,
        reasons: ['Deductions exceed gross pay. Correct manually.']
      });
    }

    // Gross - Ded = Net check
    if (!gross.sub(ded).equals(net)) {
      issues.push({
        severity: 'error',
        type: 'MATH_MISMATCH',
        employeeId: empId,
        employeeName: empName,
        message: 'Mathematical mismatch: Gross - Deductions ≠ Net Pay.',
        reasons: [`Gross: ${gross}, Deductions: ${ded}, Net: ${net}`]
      });
    }

    sumGross = sumGross.plus(gross);
    sumDed = sumDed.plus(ded);
    sumNet = sumNet.plus(net);
  }

  // Run totals check removed because totals are purely derived from items in this schema

  // 3. Find Previous Chronological Run
  const period = currentRun.payroll_periods as any;
  const { data: previousRuns } = await supabase
    .from('payroll_runs')
    .select(`
      id,
      payroll_periods!inner ( period_start, period_end, pay_frequency )
    `)
    .eq('payroll_periods.pay_frequency', period.pay_frequency)
    .lt('payroll_periods.period_start', period.period_start)
    .in('status', ['Approved', 'Paid'])
    .order('payroll_periods.period_start' as any, { ascending: false })
    .limit(1);

  let prevItemsMap = new Map<string, any>();
  if (previousRuns && previousRuns.length > 0) {
    const prevRun = previousRuns[0];
    const { data: previousItems } = await supabase
      .from('payroll_items')
      .select('employee_id, gross_pay, net_pay, total_deductions')
      .eq('payroll_run_id', prevRun.id);

    if (previousItems) {
      for (const pi of previousItems) {
        prevItemsMap.set(pi.employee_id, pi);
      }
    }

    // 4. Missing Employees Warning
    for (const [empId, pi] of prevItemsMap.entries()) {
      if (!employeeSeen.has(empId)) {
        // Look up employee name just for reporting
        const { data: eData } = await supabase.from('employees').select('first_name, last_name, employment_status').eq('id', empId).single();
        const eName = eData ? `${eData.first_name} ${eData.last_name}` : 'Unknown';
        
        const isSeparated = eData?.employment_status === 'Separated' || eData?.employment_status === 'Resigned' || eData?.employment_status === 'Terminated';
        
        issues.push({
          severity: isSeparated ? 'info' : 'warning',
          type: 'MISSING_EMPLOYEE',
          employeeId: empId,
          employeeName: eName,
          message: 'Employee missing from current payroll.',
          reasons: isSeparated ? ['Employee is separated'] : ['Was present in the previous finalized run.']
        });
      }
    }
  }

  // 5. Variance Checks
  for (const item of items) {
    const empId = item.employee_id;
    const empName = `${(item.employees as any)?.first_name} ${(item.employees as any)?.last_name}`;
    const currentNet = new Decimal(item.net_pay);
    const currentGross = new Decimal(item.gross_pay);

    const prevItem = prevItemsMap.get(empId);

    if (!prevItem) {
      if (previousRuns && previousRuns.length > 0) {
        issues.push({
          severity: 'warning',
          type: 'NEW_EMPLOYEE',
          employeeId: empId,
          employeeName: empName,
          message: 'New employee in payroll.',
          reasons: ['Employee was not present in the previous finalized run.']
        });
      }
    } else {
      const prevNet = new Decimal(prevItem.net_pay);
      const prevGross = new Decimal(prevItem.gross_pay);

      // Handle Previous Net = 0
      if (prevNet.isZero()) {
        if (!currentNet.isZero()) {
          issues.push({
            severity: 'info',
            type: 'NET_PAY_VARIANCE',
            employeeId: empId,
            employeeName: empName,
            currentValue: currentNet.toNumber(),
            previousValue: 0,
            message: `New or returned pay (was ₱0, now ₱${currentNet.toNumber().toLocaleString(undefined, {minimumFractionDigits: 2})}).`,
            reasons: []
          });
        }
      } else {
        // Current Net = 0
        if (currentNet.isZero()) {
          issues.push({
            severity: 'warning',
            type: 'ZERO_NET_PAY',
            employeeId: empId,
            employeeName: empName,
            currentValue: 0,
            previousValue: prevNet.toNumber(),
            message: 'Net pay became ₱0.',
            reasons: []
          });
        } else {
          // Standard Variance
          const diff = currentNet.sub(prevNet);
          const percent = diff.div(prevNet).mul(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

          if (percent.abs().greaterThan(10)) {
            const dir = diff.greaterThan(0) ? '↑' : '↓';
            issues.push({
              severity: 'warning',
              type: 'NET_PAY_VARIANCE',
              employeeId: empId,
              employeeName: empName,
              currentValue: currentNet.toNumber(),
              previousValue: prevNet.toNumber(),
              absoluteVariance: diff.toNumber(),
              percentageVariance: percent.toNumber(),
              message: `Net Pay variance ${dir} ${Math.abs(percent.toNumber())}% (${diff.greaterThan(0)?'+':''}₱${diff.toNumber().toLocaleString(undefined, {minimumFractionDigits: 2})})`,
              reasons: ['Exceeds 10% threshold.']
            });
          }
        }
      }
    }
  }
  
  // Return grouped issues
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');

  return {
    passedMath: errors.filter(e => e.type === 'MATH_MISMATCH').length === 0,
    errors,
    warnings,
    infos,
    hasBlockingErrors: errors.length > 0
  };
}
