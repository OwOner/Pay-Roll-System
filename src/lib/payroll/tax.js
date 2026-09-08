"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateWithholdingTax = calculateWithholdingTax;
var decimal_js_1 = require("decimal.js");
/**
 * Calculates the Withholding Tax (BIR Annex E).
 *
 * Taxable Compensation = Total Taxable Earnings - Mandatory Contributions (SSS, PhilHealth, Pag-IBIG employee shares)
 */
function calculateWithholdingTax(taxableCompensation, context) {
    var taxConfig = context.taxConfig;
    var payFrequency = context.period.pay_frequency;
    // Filter brackets for the applicable pay frequency
    var applicableBrackets = taxConfig.brackets
        .filter(function (b) { return b.pay_frequency === payFrequency; })
        .sort(function (a, b) { return a.minimum_income.comparedTo(b.minimum_income); });
    if (applicableBrackets.length === 0) {
        // If no tax brackets are defined for this frequency, assume 0 tax
        // (Useful for testing before tax tables are fully populated)
        return [];
    }
    // Find the correct bracket
    var selectedBracket = applicableBrackets[0];
    for (var _i = 0, applicableBrackets_1 = applicableBrackets; _i < applicableBrackets_1.length; _i++) {
        var bracket = applicableBrackets_1[_i];
        var min = bracket.minimum_income;
        var max = bracket.maximum_income;
        if (taxableCompensation.greaterThanOrEqualTo(min) && (max === null || taxableCompensation.lessThanOrEqualTo(max))) {
            selectedBracket = bracket;
            break; // Found the highest applicable bracket
        }
    }
    // Formula: Base Tax + ((Taxable Compensation - Minimum Income) * Excess Rate)
    var withholdingTax = new decimal_js_1.default(0);
    if (selectedBracket.excess_rate.greaterThan(0)) {
        var excessIncome = taxableCompensation.sub(selectedBracket.minimum_income);
        var excessTax = excessIncome.mul(selectedBracket.excess_rate);
        withholdingTax = selectedBracket.base_tax.plus(excessTax);
    }
    else {
        // If excess rate is 0, just use base tax (typically for the lowest bracket where tax is 0)
        withholdingTax = selectedBracket.base_tax;
    }
    withholdingTax = withholdingTax.toDecimalPlaces(2, decimal_js_1.default.ROUND_HALF_UP);
    var deductions = [];
    if (withholdingTax.greaterThan(0)) {
        deductions.push({
            type: "Withholding Tax",
            description: "BIR Withholding Tax",
            amount: withholdingTax,
            employer_amount: new decimal_js_1.default(0),
            source: "system_calc",
            source_id: taxConfig.id
        });
    }
    return deductions;
}
