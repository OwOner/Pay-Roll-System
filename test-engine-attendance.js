"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var engine_1 = require("./src/lib/payroll/engine");
var decimal_js_1 = require("decimal.js");
// Mock configurations
var mockTaxConfig = {
    id: "tax-1",
    name: "2024 Tax",
    brackets: [
        {
            id: "tb-1",
            pay_frequency: "Semi-Monthly",
            minimum_income: new decimal_js_1.default(0),
            maximum_income: new decimal_js_1.default(10417),
            base_tax: new decimal_js_1.default(0),
            excess_rate: new decimal_js_1.default(0)
        }
    ]
};
var mockSssConfig = {
    id: "sss-1",
    brackets: [
        {
            id: "sb-1",
            minimum_compensation: new decimal_js_1.default(0),
            maximum_compensation: new decimal_js_1.default(99999),
            monthly_salary_credit: new decimal_js_1.default(15000),
            regular_ss_employee: new decimal_js_1.default(675),
            regular_ss_employer: new decimal_js_1.default(1425),
            mpf_employee: new decimal_js_1.default(0),
            mpf_employer: new decimal_js_1.default(0),
            ec_employer: new decimal_js_1.default(30)
        }
    ]
};
var mockPhilhealthConfig = {
    id: "ph-1",
    premium_rate: new decimal_js_1.default(0.05),
    floor_mbs: new decimal_js_1.default(10000),
    ceiling_mbs: new decimal_js_1.default(100000)
};
var mockPagibigConfig = {
    id: "pag-1",
    employee_rate_low: new decimal_js_1.default(0.01),
    employee_rate_high: new decimal_js_1.default(0.02),
    salary_threshold: new decimal_js_1.default(1500),
    employer_rate: new decimal_js_1.default(0.02),
    max_compensation: new decimal_js_1.default(10000)
};
var baseContext = {
    period: {
        id: "p-1",
        period_start: "2026-09-01",
        period_end: "2026-09-15",
        pay_frequency: "Semi-Monthly"
    },
    attendance: [],
    leaves: [],
    holidays: [],
    adjustments: [],
    taxConfig: mockTaxConfig,
    sssConfig: mockSssConfig,
    philhealthConfig: mockPhilhealthConfig,
    pagibigConfig: mockPagibigConfig
};
function runTest(name, contextOverrides) {
    console.log("\n=== TEST: ".concat(name, " ==="));
    var ctx = __assign(__assign({}, baseContext), contextOverrides);
    try {
        var result = (0, engine_1.calculatePayroll)(ctx);
        console.log("Gross Pay: ".concat(result.gross_pay.toString()));
        console.log("Taxable Comp: ".concat(result.taxable_compensation.toString()));
        console.log("Total Deductions: ".concat(result.total_employee_deductions.toString()));
        console.log("Net Pay: ".concat(result.net_pay.toString()));
        console.log("Earnings:");
        result.earnings.forEach(function (e) { return console.log(" - ".concat(e.description, ": ").concat(e.amount.toString())); });
        console.log("Deductions:");
        result.deductions.forEach(function (d) { return console.log(" - ".concat(d.description, ": ").concat(d.amount.toString())); });
    }
    catch (e) {
        console.error("Error:", e.message);
    }
}
// Test 1: Monthly Employee, No Absences
runTest("Monthly Employee - No Absences", {
    employee: {
        id: "emp-monthly",
        history: [{
                effective_from: "2026-01-01",
                effective_to: null,
                salary_type: "Monthly",
                basic_salary: new decimal_js_1.default(30000),
                daily_rate: new decimal_js_1.default(1153.85)
            }]
    },
    timesheet: {
        id: "ts-1",
        absent_days: new decimal_js_1.default(0),
        late_undertime_hours: new decimal_js_1.default(0),
        total_regular_hours: new decimal_js_1.default(88),
        total_overtime_hours: new decimal_js_1.default(0)
    }
});
// Test 2: Monthly Employee, 1 Absent Day
runTest("Monthly Employee - 1 Absent Day", {
    employee: {
        id: "emp-monthly-absent",
        history: [{
                effective_from: "2026-01-01",
                effective_to: null,
                salary_type: "Monthly",
                basic_salary: new decimal_js_1.default(30000), // Semi-monthly gross is 15000
                daily_rate: new decimal_js_1.default(1000)
            }]
    },
    timesheet: {
        id: "ts-2",
        absent_days: new decimal_js_1.default(1), // Should deduct 1000
        late_undertime_hours: new decimal_js_1.default(0),
        total_regular_hours: new decimal_js_1.default(80),
        total_overtime_hours: new decimal_js_1.default(0)
    }
});
// Test 3: Daily Employee, 10 Days Worked
runTest("Daily Employee - 10 Days Worked (80 hours)", {
    employee: {
        id: "emp-daily",
        history: [{
                effective_from: "2026-01-01",
                effective_to: null,
                salary_type: "Daily",
                basic_salary: new decimal_js_1.default(0),
                daily_rate: new decimal_js_1.default(500)
            }]
    },
    timesheet: {
        id: "ts-3",
        absent_days: new decimal_js_1.default(0),
        late_undertime_hours: new decimal_js_1.default(0),
        total_regular_hours: new decimal_js_1.default(80), // 10 days * 8 hours
        total_overtime_hours: new decimal_js_1.default(0)
    }
});
