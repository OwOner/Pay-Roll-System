"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CALCULATION_ENGINE_VERSION = void 0;
exports.calculatePayroll = calculatePayroll;
var decimal_js_1 = require("decimal.js");
var earnings_1 = require("./earnings");
var contributions_1 = require("./contributions");
var tax_1 = require("./tax");
var validation_1 = require("./validation");
exports.CALCULATION_ENGINE_VERSION = "1.0.0";
/**
 * Calculates the complete payroll for a given context.
 * Must be deterministic and throw on missing configuration.
 */
function calculatePayroll(context) {
    // Guard clauses for required configs
    if (!context.taxConfig)
        throw new Error("Missing Tax configuration.");
    if (!context.sssConfig)
        throw new Error("Missing SSS configuration.");
    if (!context.philhealthConfig)
        throw new Error("Missing PhilHealth configuration.");
    if (!context.pagibigConfig)
        throw new Error("Missing Pag-IBIG configuration.");
    if (!context.employee.history || context.employee.history.length === 0) {
        throw new Error("No compensation history found for employee ".concat(context.employee.id, "."));
    }
    var earnings = [];
    var deductions = [];
    // 1. Calculate Earnings & Absence Deductions
    var basicPayResult = (0, earnings_1.calculateBasicPay)(context);
    earnings.push.apply(earnings, basicPayResult.earnings);
    deductions.push.apply(deductions, basicPayResult.deductions);
    earnings.push.apply(earnings, (0, earnings_1.calculatePaidLeave)(context));
    earnings.push.apply(earnings, (0, earnings_1.calculateOvertime)(context));
    earnings.push.apply(earnings, (0, earnings_1.calculateAdjustments)(context));
    var grossPay = new decimal_js_1.default(0);
    var totalTaxableEarnings = new decimal_js_1.default(0);
    var totalNonTaxableEarnings = new decimal_js_1.default(0);
    var sssBasis = new decimal_js_1.default(0);
    var philhealthBasis = new decimal_js_1.default(0);
    var pagibigBasis = new decimal_js_1.default(0);
    for (var _i = 0, earnings_2 = earnings; _i < earnings_2.length; _i++) {
        var earning = earnings_2[_i];
        grossPay = grossPay.plus(earning.amount);
        if (earning.is_taxable) {
            totalTaxableEarnings = totalTaxableEarnings.plus(earning.amount);
        }
        else {
            totalNonTaxableEarnings = totalNonTaxableEarnings.plus(earning.amount);
        }
        if (earning.is_sss_covered)
            sssBasis = sssBasis.plus(earning.amount);
        if (earning.is_philhealth_covered)
            philhealthBasis = philhealthBasis.plus(earning.amount);
        if (earning.is_pagibig_covered)
            pagibigBasis = pagibigBasis.plus(earning.amount);
    }
    // Subtract pre-tax deductions (like Absences) from the bases before calculating statutory contributions
    for (var _a = 0, deductions_1 = deductions; _a < deductions_1.length; _a++) {
        var ded = deductions_1[_a];
        if (ded.is_pre_tax) {
            totalTaxableEarnings = totalTaxableEarnings.sub(ded.amount);
        }
        if (ded.is_sss_deductible)
            sssBasis = sssBasis.sub(ded.amount);
        if (ded.is_philhealth_deductible)
            philhealthBasis = philhealthBasis.sub(ded.amount);
        if (ded.is_pagibig_deductible)
            pagibigBasis = pagibigBasis.sub(ded.amount);
    }
    // Ensure bases don't go below 0
    if (sssBasis.lessThan(0))
        sssBasis = new decimal_js_1.default(0);
    if (philhealthBasis.lessThan(0))
        philhealthBasis = new decimal_js_1.default(0);
    if (pagibigBasis.lessThan(0))
        pagibigBasis = new decimal_js_1.default(0);
    if (totalTaxableEarnings.lessThan(0))
        totalTaxableEarnings = new decimal_js_1.default(0);
    // 2. Calculate Statutory Contributions
    deductions.push.apply(deductions, (0, contributions_1.calculateSSS)(sssBasis, context));
    deductions.push.apply(deductions, (0, contributions_1.calculatePhilHealth)(philhealthBasis, context));
    deductions.push.apply(deductions, (0, contributions_1.calculatePagIBIG)(pagibigBasis, context));
    // 3. Compute Taxable Compensation
    // Taxable Comp = Taxable Earnings - Mandatory Employee Contributions (SSS, PhilHealth, Pag-IBIG)
    var mandatoryContributions = new decimal_js_1.default(0);
    var sssEmployee = new decimal_js_1.default(0);
    var sssEmployer = new decimal_js_1.default(0);
    var sssEc = new decimal_js_1.default(0);
    var philhealthEmployee = new decimal_js_1.default(0);
    var philhealthEmployer = new decimal_js_1.default(0);
    var pagibigEmployee = new decimal_js_1.default(0);
    var pagibigEmployer = new decimal_js_1.default(0);
    for (var _b = 0, deductions_2 = deductions; _b < deductions_2.length; _b++) {
        var ded = deductions_2[_b];
        if (ded.type === "SSS") {
            mandatoryContributions = mandatoryContributions.plus(ded.amount);
            sssEmployee = sssEmployee.plus(ded.amount);
            if (ded.employer_amount) {
                if (ded.description.includes("EC")) {
                    sssEc = sssEc.plus(ded.employer_amount);
                }
                else {
                    sssEmployer = sssEmployer.plus(ded.employer_amount);
                }
            }
        }
        else if (ded.type === "PhilHealth") {
            mandatoryContributions = mandatoryContributions.plus(ded.amount);
            philhealthEmployee = philhealthEmployee.plus(ded.amount);
            if (ded.employer_amount)
                philhealthEmployer = philhealthEmployer.plus(ded.employer_amount);
        }
        else if (ded.type === "Pag-IBIG") {
            mandatoryContributions = mandatoryContributions.plus(ded.amount);
            pagibigEmployee = pagibigEmployee.plus(ded.amount);
            if (ded.employer_amount)
                pagibigEmployer = pagibigEmployer.plus(ded.employer_amount);
        }
    }
    var taxableCompensation = totalTaxableEarnings.sub(mandatoryContributions);
    if (taxableCompensation.lessThan(0)) {
        taxableCompensation = new decimal_js_1.default(0);
    }
    // 4. Calculate Withholding Tax
    var taxDeductions = (0, tax_1.calculateWithholdingTax)(taxableCompensation, context);
    deductions.push.apply(deductions, taxDeductions);
    // Apply Overrides
    if (context.overrides && context.overrides.length > 0) {
        var _loop_1 = function (override) {
            // Find matching earning
            var earningMatch = earnings.find(function (e) { return e.type === override.type && e.description === override.description; });
            if (earningMatch) {
                earningMatch.calculated_amount = earningMatch.amount;
                earningMatch.overridden_amount = override.overridden_amount;
                earningMatch.override_reason = override.override_reason;
                earningMatch.amount = override.overridden_amount;
            }
            // Find matching deduction
            var deductionMatch = deductions.find(function (d) { return d.type === override.type && d.description === override.description; });
            if (deductionMatch) {
                deductionMatch.calculated_amount = deductionMatch.amount;
                deductionMatch.overridden_amount = override.overridden_amount;
                deductionMatch.override_reason = override.override_reason;
                deductionMatch.amount = override.overridden_amount;
            }
        };
        for (var _c = 0, _d = context.overrides; _c < _d.length; _c++) {
            var override = _d[_c];
            _loop_1(override);
        }
    }
    // 5. Aggregate Totals
    var finalGrossPay = new decimal_js_1.default(0);
    var finalTotalEmployeeDeductions = new decimal_js_1.default(0);
    var finalTotalEmployerContributions = new decimal_js_1.default(0);
    var finalWithholdingTax = new decimal_js_1.default(0);
    for (var _e = 0, earnings_3 = earnings; _e < earnings_3.length; _e++) {
        var earning = earnings_3[_e];
        finalGrossPay = finalGrossPay.plus(earning.amount);
    }
    for (var _f = 0, deductions_3 = deductions; _f < deductions_3.length; _f++) {
        var ded = deductions_3[_f];
        finalTotalEmployeeDeductions = finalTotalEmployeeDeductions.plus(ded.amount);
        if (ded.employer_amount) {
            finalTotalEmployerContributions = finalTotalEmployerContributions.plus(ded.employer_amount);
        }
        if (ded.type === "Withholding Tax") {
            finalWithholdingTax = finalWithholdingTax.plus(ded.amount);
        }
    }
    var finalNetPay = finalGrossPay.sub(finalTotalEmployeeDeductions);
    if (finalNetPay.lessThan(0)) {
        finalNetPay = new decimal_js_1.default(0);
    }
    var result = {
        employee_id: context.employee.id,
        payroll_period_id: context.period.id,
        earnings: earnings,
        deductions: deductions,
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
        calculation_engine_version: exports.CALCULATION_ENGINE_VERSION,
        snapshots: {
            taxTableId: context.taxConfig.id,
            sssTableId: context.sssConfig.id,
            philhealthTableId: context.philhealthConfig.id,
            pagibigTableId: context.pagibigConfig.id,
        }
    };
    // 6. Internal Validation
    (0, validation_1.validatePayrollResult)(result);
    return result;
}
