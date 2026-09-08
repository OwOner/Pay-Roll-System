import Decimal from "decimal.js";
import { PayrollContext, DeductionResult } from "./types";

/**
 * Calculates SSS contributions based on the applicable Monthly Salary Credit bracket.
 * EC (Employee's Compensation) is employer-paid and does not reduce Net Pay.
 */
export function calculateSSS(
  monthlySalary: Decimal,
  context: PayrollContext
): DeductionResult[] {
  const sssConfig = context.sssConfig;
  const deductions: DeductionResult[] = [];

  if (!context.statutoryApplicability.sss) {
    deductions.push({
      type: 'SSS',
      description: 'SSS (Not Applicable)',
      amount: new Decimal(0),
      employer_amount: new Decimal(0)
    });
    return deductions;
  }

  if (!sssConfig) {
    throw new Error(`Missing active SSS configuration for the payroll period.`);
  }

  // If there's absolutely no basis due to absences/no pay, don't deduct SSS
  if (monthlySalary.lessThanOrEqualTo(0)) {
    return deductions;
  }

  // Find the applicable bracket for the monthly salary
  let applicableBracket = sssConfig.brackets[0];
  
  for (const bracket of sssConfig.brackets) {
    const min = bracket.minimum_compensation;
    const max = bracket.maximum_compensation;

    // If max is null, it means "and above"
    if (monthlySalary.greaterThanOrEqualTo(min) && (max === null || monthlySalary.lessThanOrEqualTo(max))) {
      applicableBracket = bracket;
      break;
    }
  }

  if (applicableBracket) {
    // Regular SS
    if (applicableBracket.regular_ss_employee.greaterThan(0) || applicableBracket.regular_ss_employer.greaterThan(0)) {
      deductions.push({
        type: "SSS",
        description: "SSS Regular Contribution",
        amount: applicableBracket.regular_ss_employee,
        employer_amount: applicableBracket.regular_ss_employer,
        source: "system_calc",
        source_id: sssConfig.id
      });
    }

    // MPF (Mandatory Provident Fund)
    if (applicableBracket.mpf_employee.greaterThan(0) || applicableBracket.mpf_employer.greaterThan(0)) {
      deductions.push({
        type: "SSS",
        description: "SSS WISP (MPF)",
        amount: applicableBracket.mpf_employee,
        employer_amount: applicableBracket.mpf_employer,
        source: "system_calc",
        source_id: sssConfig.id
      });
    }

    // EC (Employer only)
    if (applicableBracket.ec_employer.greaterThan(0)) {
      deductions.push({
        type: "SSS",
        description: "SSS EC (Employer Paid)",
        amount: new Decimal(0), // Employee pays 0
        employer_amount: applicableBracket.ec_employer,
        source: "system_calc",
        source_id: sssConfig.id
      });
    }
  }

  return deductions;
}

/**
 * Calculates PhilHealth based on Monthly Basic Salary.
 * PhilHealth explicitly states: "Monthly Basic Salary excludes sales commission, overtime, 
 * allowances, 13th-month pay, bonuses, and other gratuity payments."
 */
export function calculatePhilHealth(
  monthlyBasicSalary: Decimal,
  context: PayrollContext
): DeductionResult[] {
  const config = context.philhealthConfig;
  const deductions: DeductionResult[] = [];

  if (!context.statutoryApplicability.philhealth) {
    deductions.push({
      type: 'PhilHealth',
      description: 'PhilHealth (Not Applicable)',
      amount: new Decimal(0),
      employer_amount: new Decimal(0)
    });
    return deductions;
  }

  if (!config) {
    throw new Error(`Missing active PhilHealth configuration for the payroll period.`);
  }

  // If there's absolutely no basis due to absences/no pay, don't deduct PhilHealth
  if (monthlyBasicSalary.lessThanOrEqualTo(0)) {
    return deductions;
  }

  // Apply floor and ceiling
  let basis = monthlyBasicSalary;
  if (basis.lessThan(config.floor_mbs)) {
    basis = config.floor_mbs;
  } else if (basis.greaterThan(config.ceiling_mbs)) {
    basis = config.ceiling_mbs;
  }

  // PhilHealth total premium is basis * premium_rate (e.g., 5%)
  const totalPremium = basis.mul(config.premium_rate);
  
  // Usually split 50/50 between employee and employer
  const employeeShare = totalPremium.div(2).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const employerShare = totalPremium.sub(employeeShare);

  if (employeeShare.greaterThan(0) || employerShare.greaterThan(0)) {
    deductions.push({
      type: "PhilHealth",
      description: "PhilHealth Premium",
      amount: employeeShare,
      employer_amount: employerShare,
      source: "system_calc",
      source_id: config.id
    });
  }

  return deductions;
}

/**
 * Calculates Pag-IBIG contributions.
 */
export function calculatePagIBIG(
  monthlySalary: Decimal,
  context: PayrollContext
): DeductionResult[] {
  const config = context.pagibigConfig;
  const deductions: DeductionResult[] = [];

  if (!context.statutoryApplicability.pagibig) {
    deductions.push({
      type: 'Pag-IBIG',
      description: 'Pag-IBIG (Not Applicable)',
      amount: new Decimal(0),
      employer_amount: new Decimal(0)
    });
    return deductions;
  }

  if (!config) {
    throw new Error(`Missing active Pag-IBIG configuration for the payroll period.`);
  }

  // If there's absolutely no basis due to absences/no pay, don't deduct Pag-IBIG
  if (monthlySalary.lessThanOrEqualTo(0)) {
    return deductions;
  }

  // Apply maximum compensation limit (usually PHP 5,000 for Pag-IBIG as of recent rules, though changing in 2024 to 10k)
  let basis = monthlySalary;
  if (basis.greaterThan(config.max_compensation)) {
    basis = config.max_compensation;
  }

  // Determine employee rate based on configurable salary threshold
  let employeeRate = config.employee_rate_high;
  if (monthlySalary.lessThanOrEqualTo(config.salary_threshold)) {
    employeeRate = config.employee_rate_low;
  }

  const employeeShare = basis.mul(employeeRate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const employerShare = basis.mul(config.employer_rate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  if (employeeShare.greaterThan(0) || employerShare.greaterThan(0)) {
    deductions.push({
      type: "Pag-IBIG",
      description: "Pag-IBIG Contribution",
      amount: employeeShare,
      employer_amount: employerShare,
      source: "system_calc",
      source_id: config.id
    });
  }

  return deductions;
}
