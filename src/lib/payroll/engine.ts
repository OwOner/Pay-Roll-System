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
import { WorkPolicy, DEFAULT_WORK_POLICY, deriveMonthlyStatutoryBasis } from "./rate-calculator";
import { getActiveCompensation } from "./earnings";

export const CALCULATION_ENGINE_VERSION = "2.0.0"; // Upgraded to Multiplicative Engine

export function calculatePayroll(context: PayrollContext, activePolicy?: WorkPolicy | null): PayrollCalculationResult {
  if (!context.employee.history || context.employee.history.length === 0) {
    throw new Error(`No compensation history found for employee ${context.employee.id}.`);
  }

  const earnings: EarningResult[] = [];
  const deductions: DeductionResult[] = [];

  // 1. Calculate Earnings & Deductions via Multiplicative Attendance Engine
  const attendanceResult = calculateAttendanceBasedPay(context, activePolicy || null);
  earnings.push(...attendanceResult.earnings);
  deductions.push(...attendanceResult.deductions);
  
  const adjResult = calculateAdjustments(context);
  earnings.push(...adjResult.earnings);
  deductions.push(...adjResult.deductions);

  let grossPay = new Decimal(0);
  let totalTaxableEarnings = new Decimal(0);
  let totalNonTaxableEarnings = new Decimal(0);

  // MWE Tax Exemption Logic
  const isMwe = context.statutoryApplicability?.is_mwe;
  if (isMwe) {
    for (const earning of earnings) {
      if (['Basic Pay', 'Overtime', 'Holiday Pay', 'Night Differential'].includes(earning.type) || earning.description.includes('Hazard Pay')) {
        earning.tax_treatment = 'mwe_exempt';
        earning.tax_exempt_reason = 'MWE Statutory Exemption';
        earning.is_taxable = false;
      }
    }
  }

  // Ensure default tax_treatment is set if not already present
  for (const earning of earnings) {
    if (!earning.tax_treatment) {
      earning.tax_treatment = earning.is_taxable ? 'taxable' : 'non_taxable';
    }
  }

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

  // 2. Calculate Statutory Contributions (Phase 6A Task 1)
  // Use the strict Monthly Statutory Basis instead of current period gross pay
  const activeCompForStatutory = getActiveCompensation(context.employee.history, context.period.period_end);
  if (!activeCompForStatutory) {
    throw new Error(`No active compensation found at period end for statutory basis calculation.`);
  }
  
  // This will strictly use the compensation values and throw if configurations (like annualization_factor) are missing.
  const monthlyStatutoryBasis = deriveMonthlyStatutoryBasis(activeCompForStatutory, context.activePolicy || DEFAULT_WORK_POLICY);

  // Calculate the FULL monthly statutory obligation
  const rawSSS = calculateSSS(monthlyStatutoryBasis, context);
  const rawPhilHealth = calculatePhilHealth(monthlyStatutoryBasis, context);
  const rawPagIBIG = calculatePagIBIG(monthlyStatutoryBasis, context);

  // Apply Schedule Allocation logic (MIN(Intended, Remaining))
  const applyAllocation = (
    rawDeductions: DeductionResult[],
    allocationPercentage: Decimal | undefined,
    cumulativeTotal: Decimal | undefined
  ) => {
    const alloc = allocationPercentage || new Decimal(0);
    const cumul = cumulativeTotal || new Decimal(0);

    for (const ded of rawDeductions) {
      if (alloc.isZero()) {
        continue;
      }
      
      const intendedAmount = ded.amount.mul(alloc).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      
      // Prevent over-deduction for employee share
      const remainingAmount = ded.amount.sub(cumul);
      let finalAmount = Decimal.min(intendedAmount, remainingAmount);
      
      if (finalAmount.lessThan(0)) {
        finalAmount = new Decimal(0);
      }

      // For Employer Share, apportion it according to the schedule (they usually match the employee allocation logic)
      const intendedEmployer = ded.employer_amount 
        ? ded.employer_amount.mul(alloc).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        : undefined;

      if (finalAmount.greaterThan(0) || (intendedEmployer && intendedEmployer.greaterThan(0))) {
        deductions.push({
          ...ded,
          amount: finalAmount,
          employer_amount: intendedEmployer,
          calculated_amount: ded.amount, // Store original full monthly as calculated
        });
      }
    }
  };

  applyAllocation(rawSSS, context.statutoryAllocation?.sss_percentage, context.cumulativeStatutoryDeductions?.sss);
  applyAllocation(rawPhilHealth, context.statutoryAllocation?.philhealth_percentage, context.cumulativeStatutoryDeductions?.philhealth);
  applyAllocation(rawPagIBIG, context.statutoryAllocation?.pagibig_percentage, context.cumulativeStatutoryDeductions?.pagibig);

  // 3. Compute Taxable Compensation
  // Taxable Comp = Taxable Earnings - Mandatory Pre-Tax Employee Contributions (SSS, PhilHealth, Pag-IBIG)
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
      sssEmployee = sssEmployee.plus(ded.amount);
      if (ded.employer_amount) {
        if (ded.description.includes("EC")) {
          sssEc = sssEc.plus(ded.employer_amount);
        } else {
          sssEmployer = sssEmployer.plus(ded.employer_amount);
        }
      }
    } else if (ded.type === "PhilHealth") {
      philhealthEmployee = philhealthEmployee.plus(ded.amount);
      if (ded.employer_amount) philhealthEmployer = philhealthEmployer.plus(ded.employer_amount);
    } else if (ded.type === "Pag-IBIG") {
      pagibigEmployee = pagibigEmployee.plus(ded.amount);
      if (ded.employer_amount) pagibigEmployer = pagibigEmployer.plus(ded.employer_amount);
    }

    // Explicitly subtract ONLY marked pre-tax mandatory statutory contributions from taxable compensation
    if (ded.is_pre_tax && ["SSS", "PhilHealth", "Pag-IBIG"].includes(ded.type)) {
      mandatoryContributions = mandatoryContributions.plus(ded.amount);
    }
  }

  let taxableCompensation = totalTaxableEarnings.sub(mandatoryContributions);
  if (taxableCompensation.lessThan(0)) {
    taxableCompensation = new Decimal(0);
  }

  // 4. Calculate Withholding Tax
  const taxDeductions = calculateWithholdingTax(taxableCompensation, context);
  deductions.push(...taxDeductions);

  // Calculate available net pay before Cash Advances
  // Aggregate all earnings and deductions so far
  let currentGrossPay = new Decimal(0);
  let currentTotalDeductions = new Decimal(0);
  for (const e of earnings) currentGrossPay = currentGrossPay.plus(e.amount);
  for (const d of deductions) currentTotalDeductions = currentTotalDeductions.plus(d.amount);
  
  let availableNetPay = currentGrossPay.sub(currentTotalDeductions);
  if (availableNetPay.lessThan(0)) availableNetPay = new Decimal(0);

  // 4.5 Deduct Cash Advances (Protected by Available Net Pay)
  if (context.cashAdvances && context.cashAdvances.length > 0) {
    for (const ca of context.cashAdvances) {
      if (ca.remaining_balance.greaterThan(0) && availableNetPay.greaterThan(0)) {
        let repayment = ca.repayment_amount_per_payroll;
        if (ca.remaining_balance.lessThan(repayment)) {
          repayment = ca.remaining_balance;
        }
        
        // Cap the deduction to the available net pay
        if (repayment.greaterThan(availableNetPay)) {
          repayment = availableNetPay;
        }

        deductions.push({
          type: "Loan",
          description: `Cash Advance Repayment${ca.reason ? ` - ${ca.reason}` : ''}`,
          amount: repayment,
          source: "Cash Advance",
          source_id: ca.id,
          is_pre_tax: false,
          is_sss_deductible: false,
          is_philhealth_deductible: false,
          is_pagibig_deductible: false
        });
        
        // Update available net pay for subsequent cash advances (if any)
        availableNetPay = availableNetPay.sub(repayment);
      }
    }
  }

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
