import Decimal from "decimal.js";
import { 
  PayrollContext, 
  PayrollCalculationResult, 
  EarningResult, 
  DeductionResult 
} from "./types";
import { 
  calculateBasicPay, 
  calculateOvertime, 
  calculatePaidLeave, 
  calculateAdjustments 
} from "./earnings";
import { 
  calculateSSS, 
  calculatePhilHealth, 
  calculatePagIBIG 
} from "./contributions";
import { calculateWithholdingTax } from "./tax";
import { validatePayrollResult } from "./validation";

export const CALCULATION_ENGINE_VERSION = "1.0.0";

/**
 * Calculates the complete payroll for a given context.
 * Must be deterministic and throw on missing configuration.
 */
export function calculatePayroll(context: PayrollContext): PayrollCalculationResult {
  // Guard clauses for required configs
  if (!context.taxConfig) throw new Error("Missing Tax configuration.");
  if (!context.sssConfig) throw new Error("Missing SSS configuration.");
  if (!context.philhealthConfig) throw new Error("Missing PhilHealth configuration.");
  if (!context.pagibigConfig) throw new Error("Missing Pag-IBIG configuration.");
  if (!context.employee.history || context.employee.history.length === 0) {
    throw new Error(`No compensation history found for employee ${context.employee.id}.`);
  }

  const earnings: EarningResult[] = [];
  let deductions: DeductionResult[] = [];

  // 1. Calculate Earnings
  earnings.push(...calculateBasicPay(context));
  earnings.push(...calculatePaidLeave(context));
  earnings.push(...calculateOvertime(context));
  earnings.push(...calculateAdjustments(context));

  let grossPay = new Decimal(0);
  let totalTaxableEarnings = new Decimal(0);
  let totalNonTaxableEarnings = new Decimal(0);
  let monthlyBasicSalary = new Decimal(0);

  for (const earning of earnings) {
    grossPay = grossPay.plus(earning.amount);
    
    if (earning.is_taxable) {
      totalTaxableEarnings = totalTaxableEarnings.plus(earning.amount);
    } else {
      totalNonTaxableEarnings = totalNonTaxableEarnings.plus(earning.amount);
    }

    // Identify Monthly Basic Salary for PhilHealth basis (typically just Basic Pay + Paid Leave if it replaces basic)
    if (earning.type === "Basic Pay" || earning.type === "Paid Leave") {
      monthlyBasicSalary = monthlyBasicSalary.plus(earning.amount);
    }
  }

  // Ensure monthly basic salary doesn't include OT/Allowances per PhilHealth rules
  // The above check strictly uses Basic Pay and Paid Leave types.

  // 2. Calculate Statutory Contributions
  deductions.push(...calculateSSS(grossPay, context)); // SSS basis is gross pay or specific compensation? Standard practice: Gross Compensation is used to find MSC.
  deductions.push(...calculatePhilHealth(monthlyBasicSalary, context));
  deductions.push(...calculatePagIBIG(grossPay, context));

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
    mandatoryContributions = mandatoryContributions.plus(ded.amount);

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
      taxTableId: context.taxConfig.id,
      sssTableId: context.sssConfig.id,
      philhealthTableId: context.philhealthConfig.id,
      pagibigTableId: context.pagibigConfig.id,
    }
  };

  // 6. Internal Validation
  validatePayrollResult(result);

  return result;
}
