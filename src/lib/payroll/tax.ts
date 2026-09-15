import Decimal from "decimal.js";
import { PayrollContext, DeductionResult } from "./types";

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

  if (!taxConfig || context.statutoryApplicability?.tax === false) {
    return []; // No active tax configuration or MWE/tax-exempt, assume 0 tax
  }

  // Filter brackets for the applicable pay frequency
  const applicableBrackets = taxConfig.brackets
    .filter(b => b.pay_frequency === payFrequency)
    .sort((a, b) => a.minimum_income.comparedTo(b.minimum_income));

  if (applicableBrackets.length === 0) {
    // If no tax brackets are defined for this frequency, assume 0 tax
    // (Useful for testing before tax tables are fully populated)
    return [];
  }

  // Find the correct bracket
  let selectedBracket = applicableBrackets[0];
  for (const bracket of applicableBrackets) {
    const min = bracket.minimum_income;
    const max = bracket.maximum_income;

    if (taxableCompensation.greaterThanOrEqualTo(min) && (max === null || taxableCompensation.lessThanOrEqualTo(max))) {
      selectedBracket = bracket;
      break; // Found the highest applicable bracket
    }
  }

  // Formula: Base Tax + ((Taxable Compensation - Minimum Income) * Excess Rate)
  let withholdingTax = new Decimal(0);
  
  if (selectedBracket.excess_rate.greaterThan(0)) {
    const excessIncome = taxableCompensation.sub(selectedBracket.minimum_income);
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
      description: "BIR Withholding Tax",
      amount: withholdingTax,
      employer_amount: new Decimal(0),
      source: "system_calc",
      source_id: taxConfig.id
    });
  }

  return deductions;
}
