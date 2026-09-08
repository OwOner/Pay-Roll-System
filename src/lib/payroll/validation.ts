import Decimal from "decimal.js";
import { PayrollCalculationResult } from "./types";

export class PayrollValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayrollValidationError";
  }
}

/**
 * Validates the internal consistency of a calculated payroll result.
 * Throws a PayrollValidationError if any mathematical check fails.
 */
export function validatePayrollResult(result: PayrollCalculationResult): void {
  // 1. Gross Pay = Sum of all earnings
  let calculatedGross = new Decimal(0);
  for (const earning of result.earnings) {
    calculatedGross = calculatedGross.plus(earning.amount);
  }
  if (!calculatedGross.equals(result.gross_pay)) {
    throw new PayrollValidationError(`Gross pay mismatch. Expected ${calculatedGross.toString()}, got ${result.gross_pay.toString()}`);
  }

  // 2. Total Employee Deductions = Sum of all employee portions of deductions
  let calculatedDeductions = new Decimal(0);
  for (const ded of result.deductions) {
    calculatedDeductions = calculatedDeductions.plus(ded.amount);
  }
  if (!calculatedDeductions.equals(result.total_employee_deductions)) {
    throw new PayrollValidationError(`Total employee deductions mismatch. Expected ${calculatedDeductions.toString()}, got ${result.total_employee_deductions.toString()}`);
  }

  // 3. Total Employer Contributions = Sum of all employer portions of deductions
  let calculatedEmployerContributions = new Decimal(0);
  for (const ded of result.deductions) {
    if (ded.employer_amount) {
      calculatedEmployerContributions = calculatedEmployerContributions.plus(ded.employer_amount);
    }
  }
  if (!calculatedEmployerContributions.equals(result.total_employer_contributions)) {
    throw new PayrollValidationError(`Total employer contributions mismatch. Expected ${calculatedEmployerContributions.toString()}, got ${result.total_employer_contributions.toString()}`);
  }

  // 4. Net Pay = Gross Pay - Total Employee Deductions
  let expectedNet = result.gross_pay.sub(result.total_employee_deductions);
  if (expectedNet.lessThan(0)) {
    expectedNet = new Decimal(0);
  }
  if (!expectedNet.equals(result.net_pay)) {
    throw new PayrollValidationError(`Net pay mismatch. Expected ${expectedNet.toString()}, got ${result.net_pay.toString()}`);
  }

  // 5. Ensure employer contributions did not reduce net pay
  // (Covered by constraint 4, but let's be explicit that deductions array .employer_amount is not in the net pay math)

  // 6. Config sanity check (Tax and statutory can be null for 0 deduction fallback)
  // We no longer strictly enforce snapshots to be present, as users may disable all of them
}
