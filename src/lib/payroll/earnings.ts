import Decimal from "decimal.js";
import { 
  PayrollContext, 
  EarningResult,
  EmployeeCompensation,
  DeductionResult
} from "./types";
import { SYSTEM_EARNING_DESCRIPTIONS } from "./constants";
import { resolveDayRule, DayType } from "./day-rules";
import { deriveHourlyRate, WorkPolicy } from "./rate-calculator";

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
 * NEW ARCHITECTURE: Multiplicative calculation per day
 */
export function calculateAttendanceBasedPay(
  context: PayrollContext,
  policy: WorkPolicy | null
): { earnings: EarningResult[], deductions: DeductionResult[] } {
  const earnings: EarningResult[] = [];
  const deductions: DeductionResult[] = [];
  
  if (!context.timesheet) {
    throw new Error("Missing timesheet for the payroll period.");
  }

  const details = context.timesheet.details || [];
  console.log(`[ENGINE] Processing ${details.length} timesheet details for ${context.employee.id}. History count: ${context.employee.history.length}`);
  
  let totalRegularEarnings = new Decimal(0);
  let totalOtEarnings = new Decimal(0);
  let totalNightEarnings = new Decimal(0);
  let totalUtDeductions = new Decimal(0);

  for (const detail of details) {
    const comp = getActiveCompensation(context.employee.history, detail.date);
    if (!comp) {
      console.log(`[ENGINE] Missing comp for date ${detail.date}`);
      continue;
    }

    const rates = deriveHourlyRate(comp, policy);
    console.log(`[ENGINE] Date ${detail.date} | Rate: ${rates.baseHourlyRate.toString()} | Regular Hrs: ${detail.regular_hours}`);
    const baseHourlyRate = rates.baseHourlyRate;

    // 3. Resolve Day Rules (Statutory vs Company)
    const dayType = detail.day_type as DayType;
    const rule = resolveDayRule(dayType, policy?.custom_day_rules || {});

    // 4. Calculate Earnings (Multiplicative Composition)
    const regularHours = new Decimal(detail.regular_hours);
    const payableOtHours = new Decimal(detail.payable_ot_hours);
    const payableUtHours = new Decimal(detail.payable_ut_hours);
    // Night hours would be provided by timesheet in a full implementation
    const nightHours = new Decimal((detail as any).night_hours || 0);

    // Regular Pay for the day: regular_hours * hourlyRate * BaseMultiplier
    if (regularHours.greaterThan(0)) {
       const dailyRegularPay = regularHours.mul(baseHourlyRate).mul(rule.baseMultiplier);
       totalRegularEarnings = totalRegularEarnings.plus(dailyRegularPay);
    }

    // Overtime Pay: payable_ot * hourlyRate * BaseMultiplier * OTMultiplier
    if (payableOtHours.greaterThan(0)) {
       const otHourlyRate = baseHourlyRate.mul(rule.baseMultiplier).mul(rule.otMultiplier);
       const otPay = payableOtHours.mul(otHourlyRate);
       totalOtEarnings = totalOtEarnings.plus(otPay);
    }

    // Night Diff Pay: night_hours * hourlyRate * ActiveRate * NightMultiplier
    if (nightHours.greaterThan(0)) {
       // Assume night diff is on regular hours for simplicity, 
       // but in reality you'd split night regular vs night OT.
       // Active Rate = BaseMultiplier 
       const nightRate = baseHourlyRate.mul(rule.baseMultiplier).mul(rule.nightDifferentialMultiplier.minus(1)); // The premium is 10%, so 1.10 - 1 = 0.10
       const nightPay = nightHours.mul(nightRate);
       totalNightEarnings = totalNightEarnings.plus(nightPay);
    }

    // Undertime Deduction: payable_ut * hourlyRate
    if (payableUtHours.greaterThan(0)) {
       const utDeduction = payableUtHours.mul(baseHourlyRate);
       totalUtDeductions = totalUtDeductions.plus(utDeduction);
    }
  }

  // Push aggregated results
  if (totalRegularEarnings.greaterThan(0)) {
    earnings.push({
      type: "Basic Pay",
      description: SYSTEM_EARNING_DESCRIPTIONS.BASIC_SALARY,
      amount: totalRegularEarnings,
      is_taxable: true,
      is_sss_covered: true,
      is_philhealth_covered: true,
      is_pagibig_covered: true,
      source: "timesheet",
      source_id: context.timesheet.id
    });
  }

  if (totalOtEarnings.greaterThan(0)) {
    earnings.push({
      type: "Overtime",
      description: "Overtime Pay",
      amount: totalOtEarnings,
      is_taxable: true,
      is_sss_covered: true,
      is_philhealth_covered: false,
      is_pagibig_covered: true,
      source: "timesheet",
      source_id: context.timesheet.id
    });
  }

  if (totalNightEarnings.greaterThan(0)) {
    earnings.push({
      type: "Other",
      description: "Night Differential",
      amount: totalNightEarnings,
      is_taxable: true,
      is_sss_covered: true,
      is_philhealth_covered: false,
      is_pagibig_covered: true,
      source: "timesheet",
      source_id: context.timesheet.id
    });
  }

  if (totalUtDeductions.greaterThan(0)) {
    deductions.push({
      type: "Other",
      description: "Undertime/Late Deductions",
      amount: totalUtDeductions,
      is_pre_tax: true,
      is_sss_deductible: true,
      is_philhealth_deductible: true,
      is_pagibig_deductible: true,
      source: "timesheet",
      source_id: context.timesheet.id
    });
  }

  return { earnings, deductions };
}


export function calculateAdjustments(context: PayrollContext): { earnings: EarningResult[], deductions: DeductionResult[] } {
  const earnings: EarningResult[] = [];
  const deductions: DeductionResult[] = [];
  
  for (const adj of context.adjustments) {
    if (adj.type === "Earning") {
      earnings.push({
        type: "Other", 
        description: adj.description,
        amount: adj.amount,
        is_taxable: adj.is_taxable ?? true,
        is_sss_covered: adj.is_taxable ?? true, 
        is_philhealth_covered: false, 
        is_pagibig_covered: adj.is_taxable ?? true,
        source: "payroll_adjustments",
        source_id: adj.id
      });
    } else if (adj.type === "Deduction") {
      deductions.push({
        type: "Other",
        description: adj.description,
        amount: adj.amount,
        is_pre_tax: false, // by default, adjustments are post-tax unless specified
        is_sss_deductible: false,
        is_philhealth_deductible: false,
        is_pagibig_deductible: false,
        source: "payroll_adjustments",
        source_id: adj.id
      });
    }
  }

  return { earnings, deductions };
}
