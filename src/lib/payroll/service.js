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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPayrollContext = loadPayrollContext;
exports.finalizePayrollCalculation = finalizePayrollCalculation;
var server_1 = require("@/lib/supabase/server");
var decimal_js_1 = require("decimal.js");
// Note: This service currently stubs out the actual Supabase database fetches.
// In Phase 8, when we run the payroll, we will implement the full SQL queries 
function loadPayrollContext(employeeId, periodStart, periodEnd, payFrequency) {
    return __awaiter(this, void 0, void 0, function () {
        var supabase, periodData, _a, employee, empError, activeComp, empData, taxTables, taxConfig, govTables, sssTable, phTable, pagibigTable, sssConfig, phBrackets, phRateBracket, philhealthConfig, pagibigConfig, attendanceData, mappedAttendance;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, server_1.createClient)()];
                case 1:
                    supabase = _b.sent();
                    periodData = {
                        id: "preview-period-id",
                        period_start: periodStart,
                        period_end: periodEnd,
                        pay_frequency: payFrequency,
                    };
                    return [4 /*yield*/, supabase
                            .from('employees')
                            .select('*, employee_compensation_history(*)')
                            .eq('id', employeeId)
                            .single()];
                case 2:
                    _a = _b.sent(), employee = _a.data, empError = _a.error;
                    if (empError || !employee)
                        throw new Error("Failed to load employee.");
                    activeComp = employee.employee_compensation_history
                        .filter(function (c) {
                        var from = new Date(c.effective_from);
                        var to = c.effective_to ? new Date(c.effective_to) : null;
                        var periodEnd = new Date(periodData.period_end);
                        var periodStart = new Date(periodData.period_start);
                        return from <= periodEnd && (!to || to >= periodStart);
                    })
                        .sort(function (a, b) { return new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime(); })[0];
                    if (!activeComp) {
                        throw new Error("No active compensation found for employee ".concat(employeeId, " during this period."));
                    }
                    empData = {
                        id: employee.id,
                        first_name: employee.first_name,
                        last_name: employee.last_name,
                        employment_type: employee.employment_type,
                        history: [{
                                id: activeComp.id,
                                effective_from: activeComp.effective_from,
                                effective_to: activeComp.effective_to,
                                salary_type: activeComp.salary_type,
                                basic_salary: new decimal_js_1.default(activeComp.basic_salary),
                                daily_rate: new decimal_js_1.default(activeComp.daily_rate || 0),
                            }]
                    };
                    return [4 /*yield*/, supabase
                            .from('tax_tables')
                            .select('*, tax_brackets(*)')
                            .eq('is_active', true)
                            .lte('effective_from', periodData.period_end)
                            .order('effective_from', { ascending: false })
                            .limit(1)];
                case 3:
                    taxTables = (_b.sent()).data;
                    if (!taxTables || taxTables.length === 0)
                        throw new Error("No active tax table found.");
                    taxConfig = {
                        id: taxTables[0].id,
                        name: taxTables[0].name,
                        brackets: taxTables[0].tax_brackets.map(function (b) { return (__assign(__assign({}, b), { minimum_income: new decimal_js_1.default(b.minimum_income), maximum_income: b.maximum_income ? new decimal_js_1.default(b.maximum_income) : null, base_tax: new decimal_js_1.default(b.base_tax), excess_rate: new decimal_js_1.default(b.excess_rate) })); })
                    };
                    return [4 /*yield*/, supabase
                            .from('government_contribution_tables')
                            .select('*, government_contribution_brackets(*)')
                            .eq('is_active', true)
                            .lte('effective_from', periodData.period_end)
                            .order('effective_from', { ascending: false })];
                case 4:
                    govTables = (_b.sent()).data;
                    sssTable = govTables === null || govTables === void 0 ? void 0 : govTables.find(function (t) { return t.contribution_type === 'SSS'; });
                    phTable = govTables === null || govTables === void 0 ? void 0 : govTables.find(function (t) { return t.contribution_type === 'PhilHealth'; });
                    pagibigTable = govTables === null || govTables === void 0 ? void 0 : govTables.find(function (t) { return t.contribution_type === 'Pag-IBIG'; });
                    if (!sssTable || !phTable || !pagibigTable) {
                        throw new Error("Missing active statutory configurations.");
                    }
                    sssConfig = {
                        id: sssTable.id,
                        brackets: sssTable.government_contribution_brackets.map(function (b) { return ({
                            id: b.id,
                            minimum_compensation: new decimal_js_1.default(b.salary_min),
                            maximum_compensation: b.salary_max ? new decimal_js_1.default(b.salary_max) : null,
                            monthly_salary_credit: new decimal_js_1.default(b.salary_min), // Using salary_min as MSC for now
                            regular_ss_employee: new decimal_js_1.default(b.employee_amount),
                            regular_ss_employer: new decimal_js_1.default(b.employer_amount),
                            mpf_employee: new decimal_js_1.default(0),
                            mpf_employer: new decimal_js_1.default(0),
                            ec_employer: new decimal_js_1.default(0)
                        }); })
                    };
                    phBrackets = phTable.government_contribution_brackets;
                    phRateBracket = phBrackets.find(function (b) { return b.employee_rate > 0; });
                    philhealthConfig = {
                        id: phTable.id,
                        premium_rate: new decimal_js_1.default(phRateBracket ? phRateBracket.employee_rate * 2 : 0.05), // Total premium rate
                        floor_mbs: new decimal_js_1.default(10000), // Hardcoded fallbacks if not found correctly
                        ceiling_mbs: new decimal_js_1.default(100000)
                    };
                    pagibigConfig = {
                        id: pagibigTable.id,
                        employee_rate_below_1500: new decimal_js_1.default(0.01),
                        employee_rate_above_1500: new decimal_js_1.default(0.02),
                        employer_rate: new decimal_js_1.default(0.02),
                        max_compensation: new decimal_js_1.default(10000)
                    };
                    return [4 /*yield*/, supabase
                            .from('attendance_records')
                            .select('*')
                            .eq('employee_id', employeeId)
                            .gte('work_date', periodData.period_start)
                            .lte('work_date', periodData.period_end)];
                case 5:
                    attendanceData = (_b.sent()).data;
                    mappedAttendance = attendanceData ? attendanceData.map(function (a) { return ({
                        id: a.id,
                        record_date: a.work_date,
                        status: a.status,
                        regular_hours_worked: new decimal_js_1.default(a.regular_hours || 0),
                        overtime_hours: new decimal_js_1.default(a.overtime_hours || 0),
                        night_differential_hours: new decimal_js_1.default(a.night_differential_hours || 0),
                        is_rest_day: a.is_rest_day || false
                    }); }) : [];
                    return [2 /*return*/, {
                            employee: empData,
                            period: periodData,
                            attendance: mappedAttendance,
                            leaves: [],
                            holidays: [],
                            adjustments: [], // No manual adjustments initially
                            overrides: [],
                            taxConfig: taxConfig,
                            sssConfig: sssConfig,
                            philhealthConfig: philhealthConfig,
                            pagibigConfig: pagibigConfig
                        }];
            }
        });
    });
}
function finalizePayrollCalculation(payrollRunId, results) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // STUB: This function will use a PostgreSQL RPC or sequential atomic transaction
            throw new Error("finalizePayrollCalculation is not fully implemented yet.");
        });
    });
}
