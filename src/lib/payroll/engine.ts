import Decimal from "decimal.js";
import { 
  PayrollContext, 
  PayrollCalculationResult, 
  EarningResult, 
  DeductionResult 
} from "./types";
import { 
  calculateAttendanceBasedPay, 
  calculateAdjustments 
} from "./earnings";
import { 
  calculateSSS, 
  calculatePhilHealth, 
  calculatePagIBIG 
} from "./contributions";
import { calculateWithholdingTax } from "./tax";
import { validatePayrollResult } from "./validation";
import { WorkPolicy } from "./rate-calculator";

export const CALCULATION_ENGINE_VERSION = "2.0.0"; // Upgraded to Multiplicative Engine

export function calculatePayroll(context: PayrollContext, activePolicy: WorkPolicy): PayrollCalculationResult {
  if (!context.employee.history || context.employee.history.length === 0) {
    throw new Error(`No compensation history found for employee ${context.employee.id}.`);
  }

  const earnings: EarningResult[] = [];
  let deductions: DeductionResult[] = [];

  // 1. Calculate Earnings & Deductions via Multiplicative Attendance Engine
  const attendanceResult = calculateAttendanceBasedPay(context, activePolicy);
  earnings.push(...attendanceResult.earnings);
  deductions.push(...attendanceResult.deductions);
  
  // (In a real system, we also calculate Paid Leave here if not fully embedded in attendanceResult)
  
  earnings.push(...calculateAdjustments(context));

  let grossPay = new Decimal(0);
  let totalTaxableEarnings = new Decimal(0);
  let totalNonTaxableEarnings = new Decimal(0);
  let sssBasis = new Decimal(0);
  let philhealthBasis = new Decimal(0);
  let pagibigBasis = new Decimal(0);

  for (const earning of earnings) {
    grossPay = grossPay.plus(earning.amount);
    
    if (earning.is_taxable) {
      totalTaxableEarnings = totalTaxableEarnings.plus(earning.amount);
    } else {
      totalNonTaxableEarnings = totalNonTaxableEarnings.plus(earning.amount);
    }

    if (earning.is_sss_covered) sssBasis = sssBasis.plus(earning.amount);
    if (earning.is_philhealth_covered) philhealthBasis = philhealthBasis.plus(earning.amount);
    if (earning.is_pagibig_covered) pagibigBasis = pagibigBasis.plus(earning.amount);
  }

  // Subtract pre-tax deductions (like Absences) from the bases before calculating statutory contributions
  for (const ded of deductions) {
    if (ded.is_pre_tax) {
      totalTaxableEarnings = totalTaxableEarnings.sub(ded.amount);
    }
    if (ded.is_sss_deductible) sssBasis = sssBasis.sub(ded.amount);
    if (ded.is_philhealth_deductible) philhealthBasis = philhealthBasis.sub(ded.amount);
    if (ded.is_pagibig_deductible) pagibigBasis = pagibigBasis.sub(ded.amount);
  }

  // Ensure bases don't go below 0
  if (sssBasis.lessThan(0)) sssBasis = new Decimal(0);
  if (philhealthBasis.lessThan(0)) philhealthBasis = new Decimal(0);
  if (pagibigBasis.lessThan(0)) pagibigBasis = new Decimal(0);
  if (totalTaxableEarnings.lessThan(0)) totalTaxableEarnings = new Decimal(0);

  // 2. Calculate Statutory Contributions
  deductions.push(...calculateSSS(sssBasis, context));
  deductions.push(...calculatePhilHealth(philhealthBasis, context));
  deductions.push(...calculatePagIBIG(pagibigBasis, context));

  // 3. Compute Taxable Compensation
  // Taxable Comp = Taxable Earnings - Mandatory Employee Contributions (SSS, PhilHealth, Pag-IBIG)
  let mandatoryContributions = new Decimal(0);
  let sssEmployee = new Decimal(0);
  let sssEmployer = new Decimal(0);
  let sssEc = new Decimal(0);
  let philhealthEmployee = new Decimal(0);
  let philhealthEmployer = new Decimal(0);
  let pagibigEmployee = new Decimal(0);
  let pagibigEmployer = new Decimal(0);

  for (const ded of deductions) {
    if (ded.type === "SSS") {
      mandatoryContributions = mandatoryContributions.plus(ded.amount);
      sssEmployee = sssEmployee.plus(ded.amount);
      if (ded.employer_amount) {
        if (ded.description.includes("EC")) {
          sssEc = sssEc.plus(ded.employer_amount);
        } else {
          sssEmployer = sssEmployer.plus(ded.employer_amount);
        }
      }
    } else if (ded.type === "PhilHealth") {
      mandatoryContributions = mandatoryContributions.plus(ded.amount);
      philhealthEmployee = philhealthEmployee.plus(ded.amount);
      if (ded.employer_amount) philhealthEmployer = philhealthEmployer.plus(ded.employer_amount);
    } else if (ded.type === "Pag-IBIG") {
      mandatoryContributions = mandatoryContributions.plus(ded.amount);
      pagibigEmployee = pagibigEmployee.plus(ded.amount);
      if (ded.employer_amount) pagibigEmployer = pagibigEmployer.plus(ded.employer_amount);
    }
  }

  let taxableCompensation = totalTaxableEarnings.sub(mandatoryContributions);
  if (taxableCompensation.lessThan(0)) {
    taxableCompensation = new Decimal(0);
  }

  // 4. Calculate Withholding Tax
  const taxDeductions = calculateWithholdingTax(taxableCompensation, context);
  deductions.push(...taxDeductions);

  // Apply Overrides
  if (context.overrides && context.overrides.length > 0) {
    for (const override of context.overrides) {
      // Find matching earning
      const earningMatch = earnings.find(e => e.type === override.type && e.description === override.description);
      if (earningMatch) {
        earningMatch.calculated_amount = earningMatch.amount;
        earningMatch.overridden_amount = override.overridden_amount;
        earningMatch.override_reason = override.override_reason;
        earningMatch.amount = override.overridden_amount;
      }
      
      // Find matching deduction
      const deductionMatch = deductions.find(d => d.type === override.type && d.description === override.description);
      if (deductionMatch) {
        deductionMatch.calculated_amount = deductionMatch.amount;
        deductionMatch.overridden_amount = override.overridden_amount;
        deductionMatch.override_reason = override.override_reason;
        deductionMatch.amount = override.overridden_amount;
      }
    }
  }

  // 5. Aggregate Totals
  let finalGrossPay = new Decimal(0);
  let finalTotalEmployeeDeductions = new Decimal(0);
  let finalTotalEmployerContributions = new Decimal(0);
  let finalWithholdingTax = new Decimal(0);

  for (const earning of earnings) {
    finalGrossPay = finalGrossPay.plus(earning.amount);
  }

  for (const ded of deductions) {
    finalTotalEmployeeDeductions = finalTotalEmployeeDeductions.plus(ded.amount);
    if (ded.employer_amount) {
      finalTotalEmployerContributions = finalTotalEmployerContributions.plus(ded.employer_amount);
    }
    if (ded.type === "Withholding Tax") {
      finalWithholdingTax = finalWithholdingTax.plus(ded.amount);
    }
  }

  let finalNetPay = finalGrossPay.sub(finalTotalEmployeeDeductions);
  if (finalNetPay.lessThan(0)) {
    finalNetPay = new Decimal(0);
  }

  const result: PayrollCalculationResult = {
    employee_id: context.employee.id,
    payroll_period_id: context.period.id,
    
    earnings,
    deductions,
    
    gross_pay: finalGrossPay,
    taxable_compensation: taxableCompensation, // We keep the original basis for simplicity, or we recalculate. We'll keep it.
    non_taxable_compensation: totalNonTaxableEarnings,
    total_employee_deductions: finalTotalEmployeeDeductions,
    total_employer_contributions: finalTotalEmployerContributions,
    net_pay: finalNetPay,
    
    sss_employee: sssEmployee,
    sss_employer: sssEmployer,
    sss_ec: sssEc,
    philhealth_employee: philhealthEmployee,
    philhealth_employer: philhealthEmployer,
    pagibig_employee: pagibigEmployee,
    pagibig_employer: pagibigEmployer,
    withholding_tax: finalWithholdingTax,
    
    calculation_engine_version: CALCULATION_ENGINE_VERSION,
    snapshots: {
      taxTableId: context.taxConfig ? context.taxConfig.id : undefined,
      sssTableId: context.sssConfig ? context.sssConfig.id : undefined,
      philhealthTableId: context.philhealthConfig ? context.philhealthConfig.id : undefined,
      pagibigTableId: context.pagibigConfig ? context.pagibigConfig.id : undefined,
    }
  };

  // 6. Internal Validation
  validatePayrollResult(result);

  return result;
}
