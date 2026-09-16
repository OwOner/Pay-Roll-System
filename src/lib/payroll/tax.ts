import Decimal from "decimal.js";
import { PayrollContext, DeductionResult } from "./types";
import { SYSTEM_DEDUCTION_DESCRIPTIONS } from "./constants";

/**
 * Calculates the Withholding Tax (BIR Annex E).
 *
 * Taxable Compensation = Total Taxable Earnings - Mandatory Contributions (SSS, PhilHealth, Pag-IBIG employee shares)
 */
export function calculateWithholdingTax(
  taxableCompensation: Decimal,
  context: PayrollContext
): DeductionResult[] {
  const taxConfig = context.taxConfig;
  const payFrequency = context.period.pay_frequency;

  if (context.statutoryApplicability?.tax === false) {
    return []; // Explicitly marked as not applicable by HR configuration
  }

  if (!taxConfig) {
    throw new Error("Missing Tax Configuration: No active tax table found for the payroll period.");
  }

  if (!taxConfig.brackets || taxConfig.brackets.length === 0) {
    throw new Error(`Invalid Tax Configuration: No tax brackets defined in table '${taxConfig.name}'.`);
  }

  // Filter brackets for the applicable pay frequency
  const applicableBrackets = taxConfig.brackets
    .filter(b => b.pay_frequency === payFrequency)
    .sort((a, b) => b.minimum_income.comparedTo(a.minimum_income)); // Sort DESCENDING

  if (applicableBrackets.length === 0) {
    throw new Error(`Missing Tax Configuration: No tax brackets found for pay frequency '${payFrequency}' in table '${taxConfig.name}'.`);
  }

  // Ensure precision
  const roundedCompensation = taxableCompensation.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // Find the correct bracket (First bracket where compensation >= minimum_income)
  const selectedBracket = applicableBrackets.find(b => roundedCompensation.greaterThanOrEqualTo(b.minimum_income));

  if (!selectedBracket) {
    throw new Error(`Invalid Tax Configuration: Could not resolve a tax bracket for compensation ${roundedCompensation.toString()}. The lowest bracket must have a minimum_income of 0.`);
  }

  // Formula: Base Tax + ((Taxable Compensation - Minimum Income) * Excess Rate)
  let withholdingTax = new Decimal(0);
  
  if (selectedBracket.excess_rate.greaterThan(0)) {
    const excessIncome = roundedCompensation.sub(selectedBracket.minimum_income);
    const excessTax = excessIncome.mul(selectedBracket.excess_rate);
    withholdingTax = selectedBracket.base_tax.plus(excessTax);
  } else {
    // If excess rate is 0, just use base tax (typically for the lowest bracket where tax is 0)
    withholdingTax = selectedBracket.base_tax;
  }

  withholdingTax = withholdingTax.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const deductions: DeductionResult[] = [];
  
  if (withholdingTax.greaterThan(0)) {
    deductions.push({
      type: "Withholding Tax",
      description: SYSTEM_DEDUCTION_DESCRIPTIONS.TAX,
      amount: withholdingTax,
      employer_amount: new Decimal(0),
      source: "system_calc",
      source_id: taxConfig.id
    });
  }

  return deductions;
}
