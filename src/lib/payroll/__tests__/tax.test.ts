
import Decimal from "decimal.js";
import { calculateWithholdingTax } from "../tax";
import { calculatePayroll } from "../engine";
import { PayrollContext, TaxTableConfig, EmployeeData, PayrollPeriod } from "../types";
import { DEFAULT_WORK_POLICY } from "../rate-calculator";

// Mock Tax Configuration matching exactly what we seeded (2023+ TRAIN/CREATE)
const mockTaxConfig: TaxTableConfig = {
  id: "tax-config-1",
  name: "TRAIN/CREATE Law 2023",
  brackets: [
    // Daily
    { id: "d1", pay_frequency: "Daily", minimum_income: new Decimal(0), maximum_income: new Decimal(685), base_tax: new Decimal(0), excess_rate: new Decimal(0) },
    { id: "d2", pay_frequency: "Daily", minimum_income: new Decimal(685), maximum_income: new Decimal(1095), base_tax: new Decimal(0), excess_rate: new Decimal(0.15) },
    { id: "d3", pay_frequency: "Daily", minimum_income: new Decimal(1096), maximum_income: new Decimal(2191), base_tax: new Decimal(61.65), excess_rate: new Decimal(0.20) },
    
    // Weekly
    { id: "w1", pay_frequency: "Weekly", minimum_income: new Decimal(0), maximum_income: new Decimal(4808), base_tax: new Decimal(0), excess_rate: new Decimal(0) },
    { id: "w2", pay_frequency: "Weekly", minimum_income: new Decimal(4808), maximum_income: new Decimal(7691), base_tax: new Decimal(0), excess_rate: new Decimal(0.15) },
    { id: "w3", pay_frequency: "Weekly", minimum_income: new Decimal(7692), maximum_income: new Decimal(15384), base_tax: new Decimal(432.60), excess_rate: new Decimal(0.20) },

    // Semi-Monthly
    { id: "sm1", pay_frequency: "Semi-Monthly", minimum_income: new Decimal(0), maximum_income: new Decimal(10417), base_tax: new Decimal(0), excess_rate: new Decimal(0) },
    { id: "sm2", pay_frequency: "Semi-Monthly", minimum_income: new Decimal(10417), maximum_income: new Decimal(16666), base_tax: new Decimal(0), excess_rate: new Decimal(0.15) },
    { id: "sm3", pay_frequency: "Semi-Monthly", minimum_income: new Decimal(16667), maximum_income: new Decimal(33332), base_tax: new Decimal(937.50), excess_rate: new Decimal(0.20) },
    { id: "sm4", pay_frequency: "Semi-Monthly", minimum_income: new Decimal(33333), maximum_income: new Decimal(83332), base_tax: new Decimal(4270.70), excess_rate: new Decimal(0.25) },
    { id: "sm5", pay_frequency: "Semi-Monthly", minimum_income: new Decimal(83333), maximum_income: new Decimal(333332), base_tax: new Decimal(16770.70), excess_rate: new Decimal(0.30) },
    { id: "sm6", pay_frequency: "Semi-Monthly", minimum_income: new Decimal(333333), maximum_income: null, base_tax: new Decimal(91770.70), excess_rate: new Decimal(0.35) },

    // Monthly
    { id: "m1", pay_frequency: "Monthly", minimum_income: new Decimal(0), maximum_income: new Decimal(20833), base_tax: new Decimal(0), excess_rate: new Decimal(0) },
    { id: "m2", pay_frequency: "Monthly", minimum_income: new Decimal(20833), maximum_income: new Decimal(33332), base_tax: new Decimal(0), excess_rate: new Decimal(0.15) },
    { id: "m3", pay_frequency: "Monthly", minimum_income: new Decimal(33333), maximum_income: new Decimal(66666), base_tax: new Decimal(1875.00), excess_rate: new Decimal(0.20) },
    { id: "m4", pay_frequency: "Monthly", minimum_income: new Decimal(66667), maximum_income: new Decimal(166666), base_tax: new Decimal(8541.80), excess_rate: new Decimal(0.25) },
    { id: "m5", pay_frequency: "Monthly", minimum_income: new Decimal(166667), maximum_income: new Decimal(666666), base_tax: new Decimal(33541.80), excess_rate: new Decimal(0.30) },
    { id: "m6", pay_frequency: "Monthly", minimum_income: new Decimal(666667), maximum_income: null, base_tax: new Decimal(183541.80), excess_rate: new Decimal(0.35) },
  ]
};

// Helper to create a minimal context
function createContext(frequency: any, tax_applicable = true): PayrollContext {
  return {
    employee: {} as EmployeeData,
    period: { pay_frequency: frequency } as PayrollPeriod,
    attendance: [],
    timesheet: { id: 't1' } as any,
    leaves: [],
    holidays: [],
    adjustments: [],
    taxConfig: mockTaxConfig,
    sssConfig: null,
    philhealthConfig: null,
    pagibigConfig: null,
    activePolicy: DEFAULT_WORK_POLICY,
    statutoryApplicability: {
      sss: true,
      philhealth: true,
      pagibig: true,
      tax: tax_applicable,
      is_mwe: false
    },
    statutoryAllocation: {
      sss_percentage: new Decimal(100),
      philhealth_percentage: new Decimal(100),
      pagibig_percentage: new Decimal(100),
    },
    cumulativeStatutoryDeductions: {
      sss: new Decimal(0),
      philhealth: new Decimal(0),
      pagibig: new Decimal(0),
    }
  };
}

describe("Withholding Tax Calculation - Phase 6A Task 3", () => {
  describe("Boundary Tests", () => {
    
    it("Monthly: Exactly at lower bracket (20,833)", () => {
      const context = createContext("Monthly");
      const deductions = calculateWithholdingTax(new Decimal("20833"), context);
      expect(deductions.length).toBe(0);
    });

    it("Monthly: Just above lower bracket (20,834)", () => {
      const context = createContext("Monthly");
      const deductions = calculateWithholdingTax(new Decimal("20834"), context);
      expect(deductions.length).toBe(1);
      // 1 * 15% = 0.15
      expect(deductions[0].amount.toNumber()).toBe(0.15);
    });

    it("Monthly: Exactly at boundary end (33,332)", () => {
      const context = createContext("Monthly");
      const deductions = calculateWithholdingTax(new Decimal("33332"), context);
      // (33332 - 20833) * 15% = 12499 * 0.15 = 1874.85
      expect(deductions[0].amount.toNumber()).toBe(1874.85);
    });

    it("Monthly: Exactly at next bracket base (33,333)", () => {
      const context = createContext("Monthly");
      const deductions = calculateWithholdingTax(new Decimal("33333"), context);
      // Base tax of bracket 3 is 1875.00
      expect(deductions[0].amount.toNumber()).toBe(1875.00);
    });

    it("Monthly: High boundary check (666,666)", () => {
      const context = createContext("Monthly");
      const deductions = calculateWithholdingTax(new Decimal("666666"), context);
      // Base: 33541.80 + 30% over 166667
      // 33541.80 + (499999 * 0.3) = 33541.80 + 149999.70 = 183541.50
      expect(deductions[0].amount.toNumber()).toBe(183541.50);
    });

    it("Monthly: Extreme boundary check (666,667)", () => {
      const context = createContext("Monthly");
      const deductions = calculateWithholdingTax(new Decimal("666667"), context);
      expect(deductions[0].amount.toNumber()).toBe(183541.80);
    });
  });

  describe("Frequency Tests", () => {
    it("Daily frequency", () => {
      const context = createContext("Daily");
      const deductions = calculateWithholdingTax(new Decimal("1096"), context);
      expect(deductions[0].amount.toNumber()).toBe(61.65);
    });

    it("Weekly frequency", () => {
      const context = createContext("Weekly");
      const deductions = calculateWithholdingTax(new Decimal("7692"), context);
      expect(deductions[0].amount.toNumber()).toBe(432.60);
    });

    it("Semi-Monthly frequency", () => {
      const context = createContext("Semi-Monthly");
      const deductions = calculateWithholdingTax(new Decimal("16667"), context);
      expect(deductions[0].amount.toNumber()).toBe(937.50);
    });
  });

  describe("Configuration and Override Tests", () => {
    it("Throws error when tax config is missing completely", () => {
      const context = createContext("Monthly");
      context.taxConfig = null;
      expect(() => calculateWithholdingTax(new Decimal("30000"), context)).toThrow(/Missing Tax Configuration/);
    });

    it("Throws error when brackets for frequency are missing", () => {
      const context = createContext("Annual" as any);
      expect(() => calculateWithholdingTax(new Decimal("30000"), context)).toThrow(/No tax brackets found for pay frequency/);
    });

    it("Returns empty array if tax_applicable = false", () => {
      const context = createContext("Monthly", false);
      const deductions = calculateWithholdingTax(new Decimal("500000"), context);
      expect(deductions.length).toBe(0);
    });
  });
});
