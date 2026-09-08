"use strict";
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
function seedTaxes() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, taxTable, tableErr, id, brackets, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("Seeding BIR Tax Table (TRAIN Law / RR 11-2018, Annex E)...");
                    return [4 /*yield*/, supabase
                            .from('tax_tables')
                            .insert({
                            name: 'BIR TRAIN Law Tax Table (RR 11-2018, Annex E)',
                            effective_from: '2018-01-01',
                            is_active: true,
                        })
                            .select('id')
                            .single()];
                case 1:
                    _a = _b.sent(), taxTable = _a.data, tableErr = _a.error;
                    if (tableErr) {
                        console.error("Failed to create tax table:", tableErr.message);
                        return [2 /*return*/];
                    }
                    id = taxTable.id;
                    console.log("Tax table ID:", id);
                    brackets = [
                        // WEEKLY (BIR Annex E)
                        { tax_table_id: id, pay_frequency: 'Weekly', minimum_income: 0, maximum_income: 4807.99, base_tax: 0, excess_rate: 0 },
                        { tax_table_id: id, pay_frequency: 'Weekly', minimum_income: 4808, maximum_income: 7691.99, base_tax: 0, excess_rate: 0.15 },
                        { tax_table_id: id, pay_frequency: 'Weekly', minimum_income: 7692, maximum_income: 15384.99, base_tax: 432.60, excess_rate: 0.20 },
                        { tax_table_id: id, pay_frequency: 'Weekly', minimum_income: 15385, maximum_income: 38461.99, base_tax: 1971.20, excess_rate: 0.25 },
                        { tax_table_id: id, pay_frequency: 'Weekly', minimum_income: 38462, maximum_income: 153845.99, base_tax: 7740.45, excess_rate: 0.30 },
                        { tax_table_id: id, pay_frequency: 'Weekly', minimum_income: 153846, maximum_income: null, base_tax: 42355.65, excess_rate: 0.35 },
                        // SEMI-MONTHLY
                        { tax_table_id: id, pay_frequency: 'Semi-Monthly', minimum_income: 0, maximum_income: 10416.99, base_tax: 0, excess_rate: 0 },
                        { tax_table_id: id, pay_frequency: 'Semi-Monthly', minimum_income: 10417, maximum_income: 16666.99, base_tax: 0, excess_rate: 0.15 },
                        { tax_table_id: id, pay_frequency: 'Semi-Monthly', minimum_income: 16667, maximum_income: 33332.99, base_tax: 937.50, excess_rate: 0.20 },
                        { tax_table_id: id, pay_frequency: 'Semi-Monthly', minimum_income: 33333, maximum_income: 83332.99, base_tax: 4270.70, excess_rate: 0.25 },
                        { tax_table_id: id, pay_frequency: 'Semi-Monthly', minimum_income: 83333, maximum_income: 333332.99, base_tax: 16770.70, excess_rate: 0.30 },
                        { tax_table_id: id, pay_frequency: 'Semi-Monthly', minimum_income: 333333, maximum_income: null, base_tax: 91770.70, excess_rate: 0.35 },
                        // MONTHLY
                        { tax_table_id: id, pay_frequency: 'Monthly', minimum_income: 0, maximum_income: 20832.99, base_tax: 0, excess_rate: 0 },
                        { tax_table_id: id, pay_frequency: 'Monthly', minimum_income: 20833, maximum_income: 33332.99, base_tax: 0, excess_rate: 0.15 },
                        { tax_table_id: id, pay_frequency: 'Monthly', minimum_income: 33333, maximum_income: 66666.99, base_tax: 1875, excess_rate: 0.20 },
                        { tax_table_id: id, pay_frequency: 'Monthly', minimum_income: 66667, maximum_income: 166666.99, base_tax: 8541.80, excess_rate: 0.25 },
                        { tax_table_id: id, pay_frequency: 'Monthly', minimum_income: 166667, maximum_income: 666666.99, base_tax: 33541.80, excess_rate: 0.30 },
                        { tax_table_id: id, pay_frequency: 'Monthly', minimum_income: 666667, maximum_income: null, base_tax: 183541.80, excess_rate: 0.35 },
                        // DAILY
                        { tax_table_id: id, pay_frequency: 'Daily', minimum_income: 0, maximum_income: 684.99, base_tax: 0, excess_rate: 0 },
                        { tax_table_id: id, pay_frequency: 'Daily', minimum_income: 685, maximum_income: 1095.99, base_tax: 0, excess_rate: 0.15 },
                        { tax_table_id: id, pay_frequency: 'Daily', minimum_income: 1096, maximum_income: 2191.99, base_tax: 61.65, excess_rate: 0.20 },
                        { tax_table_id: id, pay_frequency: 'Daily', minimum_income: 2192, maximum_income: 5478.99, base_tax: 280.85, excess_rate: 0.25 },
                        { tax_table_id: id, pay_frequency: 'Daily', minimum_income: 5479, maximum_income: 21917.99, base_tax: 1102.60, excess_rate: 0.30 },
                        { tax_table_id: id, pay_frequency: 'Daily', minimum_income: 21918, maximum_income: null, base_tax: 6034.30, excess_rate: 0.35 },
                    ];
                    return [4 /*yield*/, supabase.from('tax_brackets').insert(brackets)];
                case 2:
                    error = (_b.sent()).error;
                    if (error) {
                        console.error("Failed to insert tax brackets:", error.message);
                    }
                    else {
                        console.log("\u2713 Seeded ".concat(brackets.length, " BIR tax brackets."));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
seedTaxes();
