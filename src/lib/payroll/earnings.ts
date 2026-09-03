import Decimal from "decimal.js";
import { 
  PayrollContext, 
  EarningResult,
  EmployeeCompensation,
  AttendanceRecord
} from "./types";

/**
 * Determines the active compensation for a specific date.
 * (Addresses Test 12 — Payroll period boundary)
 */
export function getActiveCompensation(
  history: EmployeeCompensation[],
  dateStr: string
): EmployeeCompensation | null {
  const targetDate = new Date(dateStr).getTime();
  
  for (const comp of history) {
    const start = new Date(comp.effective_from).getTime();
    const end = comp.effective_to ? new Date(comp.effective_to).getTime() : Infinity;
    
    if (targetDate >= start && targetDate <= end) {
      return comp;
    }
  }
  return null;
}

/**
 * Calculates Basic Pay for the period based on attendance.
 * If Daily Paid, it multiplies the daily rate by days worked (or uses hours).
 * If Monthly Paid, it uses the fixed semi-monthly/monthly rate, usually deducting absences.
 * For this prototype, we'll calculate based on regular hours worked.
 */
export function calculateBasicPay(context: PayrollContext): EarningResult[] {
  const earnings: EarningResult[] = [];
  
  let totalBasic = new Decimal(0);

  for (const record of context.attendance) {
    const comp = getActiveCompensation(context.employee.history, record.record_date);
    if (!comp) continue; // No active compensation for this date!

    // If strictly hourly based, calculate from regular_hours_worked.
    // If regular_hours is 0 but status is 'Present' (e.g. from Excel import),
    // default to a full day's pay (daily_rate).
    
    if (record.status === 'Present' || record.regular_hours_worked.greaterThan(0)) {
      if (record.regular_hours_worked.greaterThan(0)) {
        const hourlyRate = comp.daily_rate.div(8);
        const dailyEarned = hourlyRate.mul(record.regular_hours_worked);
        totalBasic = totalBasic.plus(dailyEarned);
      } else {
        // Full day
        totalBasic = totalBasic.plus(comp.daily_rate);
      }
    }
  }

  // If there are no attendance records but they are monthly paid, we might need a fallback,
  // but in a strict attendance-based system, attendance must be generated.
  // For now, if we have attendance, we use it.

  if (totalBasic.greaterThan(0)) {
    earnings.push({
      type: "Basic Pay",
      description: "Basic Salary",
      amount: totalBasic,
      is_taxable: true,
      source: "attendance"
    });
  }

  return earnings;
}

export function calculateOvertime(context: PayrollContext): EarningResult[] {
  const earnings: EarningResult[] = [];
  let totalOt = new Decimal(0);

  for (const record of context.attendance) {
    if (record.overtime_hours.greaterThan(0)) {
      const comp = getActiveCompensation(context.employee.history, record.record_date);
      if (!comp) continue;

      const hourlyRate = comp.daily_rate.div(8);
      // Standard OT premium in PH is 1.25x for regular days
      const otRate = hourlyRate.mul(1.25);
      const otEarned = otRate.mul(record.overtime_hours);

      totalOt = totalOt.plus(otEarned);
    }
  }

  if (totalOt.greaterThan(0)) {
    earnings.push({
      type: "Overtime",
      description: "Overtime Pay",
      amount: totalOt,
      is_taxable: true,
      source: "attendance"
    });
  }

  return earnings;
}

export function calculatePaidLeave(context: PayrollContext): EarningResult[] {
  const earnings: EarningResult[] = [];
  let totalLeavePay = new Decimal(0);

  for (const leave of context.leaves) {
    if (leave.is_paid && leave.status === 'Approved') {
      // Find compensation active at the START of the leave
      const comp = getActiveCompensation(context.employee.history, leave.start_date);
      if (!comp) continue;

      const leavePay = comp.daily_rate.mul(leave.total_days);
      totalLeavePay = totalLeavePay.plus(leavePay);
    }
  }

  if (totalLeavePay.greaterThan(0)) {
    earnings.push({
      type: "Paid Leave",
      description: "Approved Paid Leave",
      amount: totalLeavePay,
      is_taxable: true,
      source: "leave"
    });
  }

  return earnings;
}

export function calculateAdjustments(context: PayrollContext): EarningResult[] {
  const earnings: EarningResult[] = [];
  
  for (const adj of context.adjustments) {
    if (adj.type === "Earning") {
      earnings.push({
        type: "Other", // Can be mapped to Allowance, Bonus, etc based on description
        description: adj.description,
        amount: adj.amount,
        is_taxable: adj.is_taxable ?? true,
        source: "adjustment",
        source_id: adj.id
      });
    }
  }

  return earnings;
}
