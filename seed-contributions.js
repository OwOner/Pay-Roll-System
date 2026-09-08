"use strict";
/**
 * seed-contributions.ts
 *
 * Seeds verified official Philippine government contribution configurations.
 *
 * Sources:
 *   SSS:      SSS Circular No. 2024-006, effective January 1, 2025
 *             https://www.sss.gov.ph/sss-contribution-table/
 *   PhilHealth: PhilHealth Advisory No. 2025-0002 / RA 11223 (UHC Act final rate)
 *               https://www.philhealth.gov.ph/
 *   Pag-IBIG: HDMF Circular No. 460, effective February 1, 2024
 *             https://www.pagibigfund.gov.ph/
 *
 * IMPORTANT: These are government-authoritative configurations. They are seeded
 * with status='Published' and must NOT be modified after payroll calculations
 * reference them. New rates require a new superseding configuration record.
 */
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
var supabase_js_1 = require("@supabase/supabase-js");
var dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });
var supabase = (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// ============================================================
// SSS Contribution Table — Full 61-bracket MSC schedule
// Source: SSS Circular No. 2024-006 (effective January 1, 2025)
// Total rate: 15% (Employee 5%, Employer 10%)
// MSC range: ₱5,000 – ₱35,000
// MPF applies to MSC > ₱20,000 (excess above ₱20,000)
// EC: ₱10 for MSC < ₱15,000; ₱30 for MSC ≥ ₱15,000 (employer only)
// ============================================================
var SSS_BRACKETS = [
    // compensation_min, compensation_max, msc, ss_emp, ss_empr, mpf_emp, mpf_empr, ec_empr
    // Brackets 1–20: MSC ₱5,000 – ₱14,500 (EC = ₱10)
    [0, 5249.99, 5000, 250, 500, 0, 0, 10],
    [5250, 5749.99, 5500, 275, 550, 0, 0, 10],
    [5750, 6249.99, 6000, 300, 600, 0, 0, 10],
    [6250, 6749.99, 6500, 325, 650, 0, 0, 10],
    [6750, 7249.99, 7000, 350, 700, 0, 0, 10],
    [7250, 7749.99, 7500, 375, 750, 0, 0, 10],
    [7750, 8249.99, 8000, 400, 800, 0, 0, 10],
    [8250, 8749.99, 8500, 425, 850, 0, 0, 10],
    [8750, 9249.99, 9000, 450, 900, 0, 0, 10],
    [9250, 9749.99, 9500, 475, 950, 0, 0, 10],
    [9750, 10249.99, 10000, 500, 1000, 0, 0, 10],
    [10250, 10749.99, 10500, 525, 1050, 0, 0, 10],
    [10750, 11249.99, 11000, 550, 1100, 0, 0, 10],
    [11250, 11749.99, 11500, 575, 1150, 0, 0, 10],
    [11750, 12249.99, 12000, 600, 1200, 0, 0, 10],
    [12250, 12749.99, 12500, 625, 1250, 0, 0, 10],
    [12750, 13249.99, 13000, 650, 1300, 0, 0, 10],
    [13250, 13749.99, 13500, 675, 1350, 0, 0, 10],
    [13750, 14249.99, 14000, 700, 1400, 0, 0, 10],
    [14250, 14749.99, 14500, 725, 1450, 0, 0, 10],
    // Brackets 21–31: MSC ₱15,000 – ₱20,000 (EC = ₱30, no MPF)
    [14750, 15249.99, 15000, 750, 1500, 0, 0, 30],
    [15250, 15749.99, 15500, 775, 1550, 0, 0, 30],
    [15750, 16249.99, 16000, 800, 1600, 0, 0, 30],
    [16250, 16749.99, 16500, 825, 1650, 0, 0, 30],
    [16750, 17249.99, 17000, 850, 1700, 0, 0, 30],
    [17250, 17749.99, 17500, 875, 1750, 0, 0, 30],
    [17750, 18249.99, 18000, 900, 1800, 0, 0, 30],
    [18250, 18749.99, 18500, 925, 1850, 0, 0, 30],
    [18750, 19249.99, 19000, 950, 1900, 0, 0, 30],
    [19250, 19749.99, 19500, 975, 1950, 0, 0, 30],
    [19750, 20249.99, 20000, 1000, 2000, 0, 0, 30],
    // Brackets 32–61: MSC ₱20,500 – ₱35,000 (EC = ₱30, MPF applies to excess > ₱20,000)
    // SS regular employee capped at ₱1,000 (5% of ₱20,000)
    // SS regular employer capped at ₱2,000 (10% of ₱20,000)
    // MPF employee = 5% of (MSC - 20,000)
    // MPF employer = 10% of (MSC - 20,000)
    [20250, 20749.99, 20500, 1000, 2000, 25, 50, 30],
    [20750, 21249.99, 21000, 1000, 2000, 50, 100, 30],
    [21250, 21749.99, 21500, 1000, 2000, 75, 150, 30],
    [21750, 22249.99, 22000, 1000, 2000, 100, 200, 30],
    [22250, 22749.99, 22500, 1000, 2000, 125, 250, 30],
    [22750, 23249.99, 23000, 1000, 2000, 150, 300, 30],
    [23250, 23749.99, 23500, 1000, 2000, 175, 350, 30],
    [23750, 24249.99, 24000, 1000, 2000, 200, 400, 30],
    [24250, 24749.99, 24500, 1000, 2000, 225, 450, 30],
    [24750, 25249.99, 25000, 1000, 2000, 250, 500, 30],
    [25250, 25749.99, 25500, 1000, 2000, 275, 550, 30],
    [25750, 26249.99, 26000, 1000, 2000, 300, 600, 30],
    [26250, 26749.99, 26500, 1000, 2000, 325, 650, 30],
    [26750, 27249.99, 27000, 1000, 2000, 350, 700, 30],
    [27250, 27749.99, 27500, 1000, 2000, 375, 750, 30],
    [27750, 28249.99, 28000, 1000, 2000, 400, 800, 30],
    [28250, 28749.99, 28500, 1000, 2000, 425, 850, 30],
    [28750, 29249.99, 29000, 1000, 2000, 450, 900, 30],
    [29250, 29749.99, 29500, 1000, 2000, 475, 950, 30],
    [29750, 30249.99, 30000, 1000, 2000, 500, 1000, 30],
    [30250, 30749.99, 30500, 1000, 2000, 525, 1050, 30],
    [30750, 31249.99, 31000, 1000, 2000, 550, 1100, 30],
    [31250, 31749.99, 31500, 1000, 2000, 575, 1150, 30],
    [31750, 32249.99, 32000, 1000, 2000, 600, 1200, 30],
    [32250, 32749.99, 32500, 1000, 2000, 625, 1250, 30],
    [32750, 33249.99, 33000, 1000, 2000, 650, 1300, 30],
    [33250, 33749.99, 33500, 1000, 2000, 675, 1350, 30],
    [33750, 34249.99, 34000, 1000, 2000, 700, 1400, 30],
    [34250, 34749.99, 34500, 1000, 2000, 725, 1450, 30],
    [34750, null, 35000, 1000, 2000, 750, 1500, 30], // ₱34,750 and above
];
function seed() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, sssTable, sssTableErr, sssBrackets, sssBracketsErr, publishErr, _b, phData, phErr, _c, pagibigData, pagibigErr, sssCount, spot, expected;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log("=== Seeding Government Contribution Configurations ===\n");
                    // --------------------------------------------------------
                    // 1. SSS
                    // --------------------------------------------------------
                    console.log("1. Seeding SSS (Circular No. 2024-006)...");
                    return [4 /*yield*/, supabase
                            .from('government_contribution_tables')
                            .insert({
                            contribution_type: 'SSS',
                            name: 'SSS Contribution Schedule — Circular No. 2024-006',
                            table_type: 'government',
                            status: 'Draft', // Insert as Draft first
                            source_agency: 'Social Security System',
                            issuance_reference: 'SSS Circular No. 2024-006',
                            source_url: 'https://www.sss.gov.ph/sss-contribution-table/',
                            statutory_effective_from: '2025-01-01',
                            effective_from: '2025-01-01',
                            is_active: true,
                        })
                            .select('id')
                            .single()];
                case 1:
                    _a = _d.sent(), sssTable = _a.data, sssTableErr = _a.error;
                    if (sssTableErr) {
                        console.error("  ✗ Failed to create SSS table:", sssTableErr.message);
                        return [2 /*return*/];
                    }
                    sssBrackets = SSS_BRACKETS.map(function (_a) {
                        var min = _a[0], max = _a[1], msc = _a[2], ss_emp = _a[3], ss_empr = _a[4], mpf_emp = _a[5], mpf_empr = _a[6], ec = _a[7];
                        return ({
                            contribution_table_id: sssTable.id,
                            salary_min: min,
                            salary_max: max,
                            monthly_salary_credit: msc,
                            regular_ss_employee: ss_emp,
                            regular_ss_employer: ss_empr,
                            mpf_employee: mpf_emp,
                            mpf_employer: mpf_empr,
                            ec_employer: ec,
                            // Legacy columns (keep populated for backward compat)
                            employee_amount: ss_emp,
                            employer_amount: ss_empr,
                        });
                    });
                    return [4 /*yield*/, supabase
                            .from('government_contribution_brackets')
                            .insert(sssBrackets)];
                case 2:
                    sssBracketsErr = (_d.sent()).error;
                    if (sssBracketsErr) {
                        console.error("  ✗ Failed to insert SSS brackets:", sssBracketsErr.message);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, supabase
                            .from('government_contribution_tables')
                            .update({ status: 'Published', is_active: true })
                            .eq('id', sssTable.id)];
                case 3:
                    publishErr = (_d.sent()).error;
                    if (publishErr) {
                        console.error("  ✗ Failed to publish SSS table:", publishErr.message);
                        return [2 /*return*/];
                    }
                    console.log("  \u2713 SSS table created and published with ".concat(sssBrackets.length, " brackets (ID: ").concat(sssTable.id, ")"));
                    // --------------------------------------------------------
                    // 2. PhilHealth
                    // --------------------------------------------------------
                    console.log("\n2. Seeding PhilHealth (Advisory 2025-0002 / RA 11223)...");
                    return [4 /*yield*/, supabase
                            .from('philhealth_configs')
                            .insert({
                            name: 'PhilHealth Premium Rate (Advisory 2025-0002 / RA 11223)',
                            table_type: 'government',
                            status: 'Published',
                            source_agency: 'Philippine Health Insurance Corporation',
                            issuance_reference: 'PhilHealth Advisory No. 2025-0002 / RA 11223 (UHC Act)',
                            source_url: 'https://www.philhealth.gov.ph/',
                            statutory_effective_from: '2025-01-01',
                            effective_from: '2025-01-01',
                            is_active: true,
                            premium_rate: 0.050000, // 5% total (2.5% employee + 2.5% employer)
                            floor_mbs: 10000.00, // Minimum Monthly Basic Salary basis
                            ceiling_mbs: 100000.00, // Maximum Monthly Basic Salary basis
                        })
                            .select('id')
                            .single()];
                case 4:
                    _b = _d.sent(), phData = _b.data, phErr = _b.error;
                    if (phErr) {
                        console.error("  ✗ Failed to create PhilHealth config:", phErr.message);
                        return [2 /*return*/];
                    }
                    console.log("  \u2713 PhilHealth config created (ID: ".concat(phData.id, ")"));
                    console.log("    Rate: 5% | Floor MBS: \u20B110,000 | Ceiling MBS: \u20B1100,000");
                    // --------------------------------------------------------
                    // 3. Pag-IBIG / HDMF
                    // --------------------------------------------------------
                    console.log("\n3. Seeding Pag-IBIG (HDMF Circular No. 460)...");
                    return [4 /*yield*/, supabase
                            .from('pagibig_configs')
                            .insert({
                            name: 'Pag-IBIG Contribution Schedule — HDMF Circular No. 460',
                            table_type: 'government',
                            status: 'Published',
                            source_agency: 'Home Development Mutual Fund (Pag-IBIG)',
                            issuance_reference: 'HDMF Circular No. 460',
                            source_url: 'https://www.pagibigfund.gov.ph/',
                            statutory_effective_from: '2024-02-01',
                            effective_from: '2024-02-01',
                            is_active: true,
                            employee_rate_low: 0.010000, // 1% for MFS ≤ ₱1,500
                            employee_rate_high: 0.020000, // 2% for MFS > ₱1,500
                            salary_threshold: 1500.00, // The ₱1,500 threshold
                            employer_rate: 0.020000, // 2% employer
                            max_compensation: 10000.00, // MFS ceiling (max ₱10,000 for calculation)
                        })
                            .select('id')
                            .single()];
                case 5:
                    _c = _d.sent(), pagibigData = _c.data, pagibigErr = _c.error;
                    if (pagibigErr) {
                        console.error("  ✗ Failed to create Pag-IBIG config:", pagibigErr.message);
                        return [2 /*return*/];
                    }
                    console.log("  \u2713 Pag-IBIG config created (ID: ".concat(pagibigData.id, ")"));
                    console.log("    Employee: 1% (\u2264\u20B11,500) / 2% (>\u20B11,500) | Employer: 2% | Max MFS: \u20B110,000");
                    // --------------------------------------------------------
                    // 4. Verification Summary
                    // --------------------------------------------------------
                    console.log("\n=== Verification ===");
                    return [4 /*yield*/, supabase
                            .from('government_contribution_brackets')
                            .select('*', { count: 'exact', head: true })
                            .eq('contribution_table_id', sssTable.id)];
                case 6:
                    sssCount = (_d.sent()).count;
                    console.log("SSS brackets in DB: ".concat(sssCount, " (expected 61)"));
                    return [4 /*yield*/, supabase
                            .from('government_contribution_brackets')
                            .select('monthly_salary_credit, regular_ss_employee, regular_ss_employer, ec_employer')
                            .eq('contribution_table_id', sssTable.id)
                            .eq('monthly_salary_credit', 15000)
                            .single()];
                case 7:
                    spot = (_d.sent()).data;
                    if (spot) {
                        console.log("SSS MSC \u20B115,000 spot-check: Employee=\u20B1".concat(spot.regular_ss_employee, ", Employer=\u20B1").concat(spot.regular_ss_employer, ", EC=\u20B1").concat(spot.ec_employer));
                        expected = spot.regular_ss_employee === 750 && spot.regular_ss_employer === 1500 && spot.ec_employer === 30;
                        console.log("  ".concat(expected ? '✓ CORRECT' : '✗ MISMATCH — expected ₱750/₱1,500/₱30'));
                    }
                    console.log("\n✅ Contribution seeding complete.");
                    return [2 /*return*/];
            }
        });
    });
}
seed().catch(console.error);
