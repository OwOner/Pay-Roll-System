"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollValidationError = void 0;
exports.validatePayrollResult = validatePayrollResult;
var decimal_js_1 = require("decimal.js");
var PayrollValidationError = /** @class */ (function (_super) {
    __extends(PayrollValidationError, _super);
    function PayrollValidationError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = "PayrollValidationError";
        return _this;
    }
    return PayrollValidationError;
}(Error));
exports.PayrollValidationError = PayrollValidationError;
/**
 * Validates the internal consistency of a calculated payroll result.
 * Throws a PayrollValidationError if any mathematical check fails.
 */
function validatePayrollResult(result) {
    // 1. Gross Pay = Sum of all earnings
    var calculatedGross = new decimal_js_1.default(0);
    for (var _i = 0, _a = result.earnings; _i < _a.length; _i++) {
        var earning = _a[_i];
        calculatedGross = calculatedGross.plus(earning.amount);
    }
    if (!calculatedGross.equals(result.gross_pay)) {
        throw new PayrollValidationError("Gross pay mismatch. Expected ".concat(calculatedGross.toString(), ", got ").concat(result.gross_pay.toString()));
    }
    // 2. Total Employee Deductions = Sum of all employee portions of deductions
    var calculatedDeductions = new decimal_js_1.default(0);
    for (var _b = 0, _c = result.deductions; _b < _c.length; _b++) {
        var ded = _c[_b];
        calculatedDeductions = calculatedDeductions.plus(ded.amount);
    }
    if (!calculatedDeductions.equals(result.total_employee_deductions)) {
        throw new PayrollValidationError("Total employee deductions mismatch. Expected ".concat(calculatedDeductions.toString(), ", got ").concat(result.total_employee_deductions.toString()));
    }
    // 3. Total Employer Contributions = Sum of all employer portions of deductions
    var calculatedEmployerContributions = new decimal_js_1.default(0);
    for (var _d = 0, _e = result.deductions; _d < _e.length; _d++) {
        var ded = _e[_d];
        if (ded.employer_amount) {
            calculatedEmployerContributions = calculatedEmployerContributions.plus(ded.employer_amount);
        }
    }
    if (!calculatedEmployerContributions.equals(result.total_employer_contributions)) {
        throw new PayrollValidationError("Total employer contributions mismatch. Expected ".concat(calculatedEmployerContributions.toString(), ", got ").concat(result.total_employer_contributions.toString()));
    }
    // 4. Net Pay = Gross Pay - Total Employee Deductions
    var expectedNet = result.gross_pay.sub(result.total_employee_deductions);
    if (!expectedNet.equals(result.net_pay)) {
        throw new PayrollValidationError("Net pay mismatch. Expected ".concat(expectedNet.toString(), ", got ").concat(result.net_pay.toString()));
    }
    // 5. Ensure employer contributions did not reduce net pay
    // (Covered by constraint 4, but let's be explicit that deductions array .employer_amount is not in the net pay math)
    // 6. Config sanity check
    if (!result.snapshots.taxTableId || !result.snapshots.sssTableId || !result.snapshots.philhealthTableId || !result.snapshots.pagibigTableId) {
        throw new PayrollValidationError("Missing configuration snapshot IDs in calculation result.");
    }
}
