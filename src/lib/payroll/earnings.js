"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveCompensation = getActiveCompensation;
exports.calculateBasicPay = calculateBasicPay;
exports.calculateOvertime = calculateOvertime;
exports.calculatePaidLeave = calculatePaidLeave;
exports.calculateAdjustments = calculateAdjustments;
var decimal_js_1 = require("decimal.js");
/**
 * Determines the active compensation for a specific date.
 * (Addresses Test 12 — Payroll period boundary)
 */
function getActiveCompensation(history, dateStr) {
    var targetDate = new Date(dateStr).getTime();
    for (var _i = 0, history_1 = history; _i < history_1.length; _i++) {
        var comp = history_1[_i];
        var start = new Date(comp.effective_from).getTime();
        var end = comp.effective_to ? new Date(comp.effective_to).getTime() : Infinity;
        if (targetDate >= start && targetDate <= end) {
            return comp;
        }
    }
    return null;
}
/**
 * Calculates Basic Pay for the period based on attendance.
 * If Daily Paid, it multiplies the daily rate by days worked (or uses hours).
 * If Monthly Paid, it uses the fixed semi-monthly/monthly rate, usually deducting absences.
 * For this prototype, we'll calculate based on regular hours worked.
 */
function calculateBasicPay(context) {
    var earnings = [];
    var deductions = [];
    if (!context.timesheet) {
        throw new Error("Missing timesheet for the payroll period.");
    }
    // Get active compensation at the start of the period for basic rate logic
    var comp = getActiveCompensation(context.employee.history, context.period.period_start);
    if (!comp) {
        throw new Error("No active compensation found for the payroll period.");
    }
    if (comp.salary_type === "Monthly") {
        // 1. Determine fixed period salary (assume semi-monthly = basic/2)
        // For a real system, you'd check pay_frequency of the period
        var periodSalary = comp.basic_salary;
        if (context.period.pay_frequency === "Semi-Monthly") {
            periodSalary = comp.basic_salary.div(2);
        }
        else if (context.period.pay_frequency === "Weekly") {
            periodSalary = comp.basic_salary.mul(12).div(52);
        }
        // Add full fixed salary as an Earning
        earnings.push({
            type: "Basic Pay",
            description: "Basic Salary",
            amount: periodSalary,
            is_taxable: true,
            is_sss_covered: true,
            is_philhealth_covered: true,
            is_pagibig_covered: true,
            source: "timesheet",
            source_id: context.timesheet.id
        });
        // 2. Calculate Absence Deductions
        if (context.timesheet.absent_days.greaterThan(0)) {
            // Offset absences with approved Paid Leave
            var netAbsentDays = context.timesheet.absent_days;
            var totalPaidLeaveDays = new decimal_js_1.default(0);
            for (var _i = 0, _a = context.leaves; _i < _a.length; _i++) {
                var leave = _a[_i];
                if (leave.is_paid && leave.status === 'Approved') {
                    totalPaidLeaveDays = totalPaidLeaveDays.plus(leave.total_days);
                }
            }
            // We deduct only UNPAID absences
            netAbsentDays = netAbsentDays.sub(totalPaidLeaveDays);
            if (netAbsentDays.lessThan(0))
                netAbsentDays = new decimal_js_1.default(0);
            if (netAbsentDays.greaterThan(0)) {
                var absenceDeduction = comp.daily_rate.mul(netAbsentDays);
                deductions.push({
                    type: "Other", // Can be a specific "Absence" type later
                    description: "Absences",
                    amount: absenceDeduction,
                    is_pre_tax: true,
                    is_sss_deductible: true,
                    is_philhealth_deductible: true,
                    is_pagibig_deductible: true,
                    source: "timesheet",
                    source_id: context.timesheet.id
                });
            }
        }
        // 3. Calculate Undertime/Late Deductions
        if (context.timesheet.late_undertime_hours.greaterThan(0)) {
            var hourlyRate = comp.daily_rate.div(8);
            var undertimeDeduction = hourlyRate.mul(context.timesheet.late_undertime_hours);
            deductions.push({
                type: "Other",
                description: "Late/Undertime",
                amount: undertimeDeduction,
                is_pre_tax: true,
                is_sss_deductible: true,
                is_philhealth_deductible: true,
                is_pagibig_deductible: true,
                source: "timesheet",
                source_id: context.timesheet.id
            });
        }
    }
    else {
        // Daily Employee
        // Basic Pay = Total Regular Hours * Hourly Rate (or Days * Daily Rate)
        // We use total_regular_hours from the timesheet
        var hourlyRate = comp.daily_rate.div(8);
        var totalBasic = hourlyRate.mul(context.timesheet.total_regular_hours);
        if (totalBasic.greaterThan(0)) {
            earnings.push({
                type: "Basic Pay",
                description: "Basic Salary (Daily)",
                amount: totalBasic,
                is_taxable: true,
                is_sss_covered: true,
                is_philhealth_covered: true,
                is_pagibig_covered: true,
                source: "timesheet",
                source_id: context.timesheet.id
            });
        }
    }
    return { earnings: earnings, deductions: deductions };
}
function calculateOvertime(context) {
    var earnings = [];
    if (!context.timesheet || context.timesheet.total_overtime_hours.lessThanOrEqualTo(0)) {
        return earnings;
    }
    var comp = getActiveCompensation(context.employee.history, context.period.period_start);
    if (!comp)
        return earnings;
    var hourlyRate = comp.daily_rate.div(8);
    // Standard OT premium in PH is 1.25x for regular days
    var otRate = hourlyRate.mul(1.25);
    var otEarned = otRate.mul(context.timesheet.total_overtime_hours);
    if (otEarned.greaterThan(0)) {
        earnings.push({
            type: "Overtime",
            description: "Overtime Pay",
            amount: otEarned,
            is_taxable: true,
            is_sss_covered: true,
            is_philhealth_covered: false,
            is_pagibig_covered: true,
            source: "timesheet",
            source_id: context.timesheet.id
        });
    }
    return earnings;
}
function calculatePaidLeave(context) {
    var earnings = [];
    var totalLeavePay = new decimal_js_1.default(0);
    for (var _i = 0, _a = context.leaves; _i < _a.length; _i++) {
        var leave = _a[_i];
        if (leave.is_paid && leave.status === 'Approved') {
            // Find compensation active at the START of the leave
            var comp = getActiveCompensation(context.employee.history, leave.start_date);
            if (!comp)
                continue;
            var leavePay = comp.daily_rate.mul(leave.total_days);
            totalLeavePay = totalLeavePay.plus(leavePay);
        }
    }
    if (totalLeavePay.greaterThan(0)) {
        earnings.push({
            type: "Paid Leave",
            description: "Approved Paid Leave",
            amount: totalLeavePay,
            is_taxable: true,
            is_sss_covered: true,
            is_philhealth_covered: true, // Paid leave substituting basic pay is included in MBS
            is_pagibig_covered: true,
            source: "leave"
        });
    }
    return earnings;
}
function calculateAdjustments(context) {
    var _a, _b, _c;
    var earnings = [];
    for (var _i = 0, _d = context.adjustments; _i < _d.length; _i++) {
        var adj = _d[_i];
        if (adj.type === "Earning") {
            earnings.push({
                type: "Other", // Can be mapped to Allowance, Bonus, etc based on description
                description: adj.description,
                amount: adj.amount,
                is_taxable: (_a = adj.is_taxable) !== null && _a !== void 0 ? _a : true,
                is_sss_covered: (_b = adj.is_taxable) !== null && _b !== void 0 ? _b : true, // Generally assuming taxable adjustments are remuneration
                is_philhealth_covered: false, // PhilHealth excludes allowances and bonuses
                is_pagibig_covered: (_c = adj.is_taxable) !== null && _c !== void 0 ? _c : true,
                source: "adjustment",
                source_id: adj.id
            });
        }
    }
    return earnings;
}
