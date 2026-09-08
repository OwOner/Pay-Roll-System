"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSSS = calculateSSS;
exports.calculatePhilHealth = calculatePhilHealth;
exports.calculatePagIBIG = calculatePagIBIG;
var decimal_js_1 = require("decimal.js");
/**
 * Calculates SSS contributions based on the applicable Monthly Salary Credit bracket.
 * EC (Employee's Compensation) is employer-paid and does not reduce Net Pay.
 */
function calculateSSS(monthlySalary, context) {
    var sssConfig = context.sssConfig;
    var deductions = [];
    // Find the applicable bracket for the monthly salary
    var applicableBracket = sssConfig.brackets[0];
    for (var _i = 0, _a = sssConfig.brackets; _i < _a.length; _i++) {
        var bracket = _a[_i];
        var min = bracket.minimum_compensation;
        var max = bracket.maximum_compensation;
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
                amount: new decimal_js_1.default(0), // Employee pays 0
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
function calculatePhilHealth(monthlyBasicSalary, context) {
    var config = context.philhealthConfig;
    var deductions = [];
    // Apply floor and ceiling
    var basis = monthlyBasicSalary;
    if (basis.lessThan(config.floor_mbs)) {
        basis = config.floor_mbs;
    }
    else if (basis.greaterThan(config.ceiling_mbs)) {
        basis = config.ceiling_mbs;
    }
    // PhilHealth total premium is basis * premium_rate (e.g., 5%)
    var totalPremium = basis.mul(config.premium_rate);
    // Usually split 50/50 between employee and employer
    var employeeShare = totalPremium.div(2).toDecimalPlaces(2, decimal_js_1.default.ROUND_HALF_UP);
    var employerShare = totalPremium.sub(employeeShare);
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
function calculatePagIBIG(monthlySalary, context) {
    var config = context.pagibigConfig;
    var deductions = [];
    // Apply maximum compensation limit (usually PHP 5,000 for Pag-IBIG as of recent rules, though changing in 2024 to 10k)
    var basis = monthlySalary;
    if (basis.greaterThan(config.max_compensation)) {
        basis = config.max_compensation;
    }
    // Determine employee rate based on configurable salary threshold
    var employeeRate = config.employee_rate_high;
    if (monthlySalary.lessThanOrEqualTo(config.salary_threshold)) {
        employeeRate = config.employee_rate_low;
    }
    var employeeShare = basis.mul(employeeRate).toDecimalPlaces(2, decimal_js_1.default.ROUND_HALF_UP);
    var employerShare = basis.mul(config.employer_rate).toDecimalPlaces(2, decimal_js_1.default.ROUND_HALF_UP);
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
