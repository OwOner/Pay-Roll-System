import { calculatePayroll } from "../engine";
import { PayrollContext, EmployeeData, PayrollPeriod, EarningResult, TaxTableConfig } from "../types";
import { DEFAULT_WORK_POLICY } from "../rate-calculator";
import Decimal from "decimal.js";

// Mock Tax Configuration matching 2023+ TRAIN/CREATE
const mockTaxConfig: TaxTableConfig = {
  id: "tax-config-1",
  name: "TRAIN/CREATE Law 2023",
  brackets: [
    { id: "sm1", pay_frequency: "Semi-Monthly", minimum_income: new Decimal(0), maximum_income: new Decimal(10417), base_tax: new Decimal(0), excess_rate: new Decimal(0) },
    { id: "sm2", pay_frequency: "Semi-Monthly", minimum_income: new Decimal(10417), maximum_income: new Decimal(16666), base_tax: new Decimal(0), excess_rate: new Decimal(0.15) },
    { id: "sm3", pay_frequency: "Semi-Monthly", minimum_income: new Decimal(16667), maximum_income: new Decimal(33332), base_tax: new Decimal(937.50), excess_rate: new Decimal(0.20) },
    { id: "sm4", pay_frequency: "Semi-Monthly", minimum_income: new Decimal(33333), maximum_income: new Decimal(83332), base_tax: new Decimal(4270.70), excess_rate: new Decimal(0.25) },
  ]
};

// Mock Attendance-Based Pay
vi.mock("../earnings", () => ({
  ...vi.importActual("../earnings"),
  calculateAttendanceBasedPay: vi.fn(),
  calculateAdjustments: vi.fn(() => ({ earnings: [], deductions: [] })),
  getActiveCompensation: vi.fn(() => ({ salary_basis: "Monthly", basic_salary: new Decimal(20000) }))
}));

// Mock Contributions
vi.mock("../contributions", () => ({
  calculateSSS: vi.fn(() => []),
  calculatePhilHealth: vi.fn(() => []),
  calculatePagIBIG: vi.fn(() => [])
}));

const { calculateAttendanceBasedPay } = vi.mocked(await import("../earnings"));
const { calculateSSS, calculatePhilHealth, calculatePagIBIG } = vi.mocked(await import("../contributions"));

function createContext(isMwe: boolean = false, tax_applicable: boolean = true): PayrollContext {
  return {
    employee: { id: "emp1", history: [{ salary_basis: "Monthly", basic_salary: new Decimal(20000), effective_from: "2020-01-01" }] } as any,
    period: { id: "p1", pay_frequency: "Semi-Monthly", period_end: "2026-09-15" } as any,
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
      sss: false, // We mock statutory deductions separately via manual injection to test pre-tax logic
      philhealth: false,
      pagibig: false,
      tax: tax_applicable,
      is_mwe: isMwe
    },
    statutoryAllocation: { sss_percentage: new Decimal(100), philhealth_percentage: new Decimal(100), pagibig_percentage: new Decimal(100) },
    cumulativeStatutoryDeductions: { sss: new Decimal(0), philhealth: new Decimal(0), pagibig: new Decimal(0) }
  };
}

describe("Engine Tax Extraction - Phase 6A Task 3", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calculateSSS.mockReturnValue([]);
    calculatePhilHealth.mockReturnValue([]);
    calculatePagIBIG.mockReturnValue([]);
  });

  describe("A. MWE Employee: 5 Exempt Categories", () => {
    it("exempts Basic, OT, Holiday, ND, and Hazard pay", () => {
      calculateAttendanceBasedPay.mockReturnValue({
        earnings: [
          { type: 'Basic Pay', amount: new Decimal(5000), is_taxable: true },
          { type: 'Overtime', amount: new Decimal(1000), is_taxable: true },
          { type: 'Holiday Pay', amount: new Decimal(500), is_taxable: true },
          { type: 'Night Differential', amount: new Decimal(300), is_taxable: true },
          { type: 'Allowance', description: 'Hazard Pay', amount: new Decimal(200), is_taxable: true }
        ],
        deductions: []
      });

      const context = createContext(true);
      const result = calculatePayroll(context);

      expect(result.taxable_compensation.toNumber()).toBe(0); // All 5 are MWE exempt
      expect(result.non_taxable_compensation.toNumber()).toBe(7000);
      expect(result.withholding_tax.toNumber()).toBe(0);

      // Verify all earnings were mutated to exempt
      expect(result.earnings.every(e => e.tax_treatment === 'mwe_exempt')).toBe(true);
      expect(result.earnings.every(e => e.is_taxable === false)).toBe(true);
    });
  });

  describe("B. MWE Employee: Unrelated Earnings", () => {
    it("respects configured tax treatment for unrelated earnings", () => {
      calculateAttendanceBasedPay.mockReturnValue({
        earnings: [
          { type: 'Basic Pay', amount: new Decimal(5000), is_taxable: true }, // MWE Exempt
          { type: 'Allowance', description: 'Sales Comm', amount: new Decimal(25000), is_taxable: true }, // Should remain taxable
          { type: 'Allowance', description: 'De Minimis', amount: new Decimal(1000), is_taxable: false } // Should remain non-taxable
        ],
        deductions: []
      });

      const context = createContext(true);
      const result = calculatePayroll(context);

      // 25,000 is taxable. Base: 937.50 + (25000 - 16667) * 0.20 = 937.50 + 1666.60 = 2604.10
      expect(result.taxable_compensation.toNumber()).toBe(25000);
      expect(result.withholding_tax.toNumber()).toBe(2604.10);
      
      const comm = result.earnings.find(e => e.description === 'Sales Comm')!;
      expect(comm.tax_treatment).toBe('taxable');
      expect(comm.is_taxable).toBe(true);
    });
  });

  describe("C. Non-MWE Employee", () => {
    it("ordinary taxable earnings remain taxable and MWE is not applied", () => {
      calculateAttendanceBasedPay.mockReturnValue({
        earnings: [
          { type: 'Basic Pay', amount: new Decimal(20000), is_taxable: true }, // NOT MWE Exempt because is_mwe is false
          { type: 'Allowance', description: 'De Minimis', amount: new Decimal(1000), is_taxable: false } // Configured non-taxable
        ],
        deductions: []
      });

      const context = createContext(false); // Non-MWE
      const result = calculatePayroll(context);

      expect(result.taxable_compensation.toNumber()).toBe(20000);
      // Bracket 3: 16667 to 33332. 937.50 + (20000 - 16667)*0.20 = 937.50 + 666.60 = 1604.10
      expect(result.withholding_tax.toNumber()).toBe(1604.10);
    });
  });

  describe("D. Mandatory Contributions (Pre-Tax)", () => {
    it("only reduces taxable compensation for explicitly marked employee pre-tax statutory deductions", () => {
      calculateAttendanceBasedPay.mockReturnValue({
        earnings: [
          { type: 'Basic Pay', amount: new Decimal(20000), is_taxable: true },
        ],
        deductions: [
          // 3. Post-tax Cash Advance (Should NOT reduce tax, injected by attendance/adjustments)
          { type: 'Loan', description: 'Cash Advance', amount: new Decimal(500), is_pre_tax: false }
        ]
      });

      calculateSSS.mockReturnValue([
          { type: 'SSS', description: 'SSS Reg', amount: new Decimal(1000), employer_amount: new Decimal(2000), is_pre_tax: true },
          { type: 'SSS', description: 'SSS EC', amount: new Decimal(0), employer_amount: new Decimal(30), is_pre_tax: false },
      ]);
      calculatePhilHealth.mockReturnValue([]);
      calculatePagIBIG.mockReturnValue([]);

      const context = createContext(false);
      context.statutoryApplicability!.sss = true; // ensure it calls SSS allocation
      const result = calculatePayroll(context);

      // Taxable Comp = 20000 - 1000 = 19000
      expect(result.taxable_compensation.toNumber()).toBe(19000);
      
      // Withholding = Bracket 3: 937.50 + (19000 - 16667)*0.20 = 937.50 + 466.60 = 1404.10
      expect(result.withholding_tax.toNumber()).toBe(1404.10);

      // Employer total = 2030
      expect(result.total_employer_contributions.toNumber()).toBe(2030);
    });
  });

  describe("E. Edge Cases", () => {
    it("zero earnings", () => {
      calculateAttendanceBasedPay.mockReturnValue({ earnings: [], deductions: [] });
      const context = createContext(false);
      const result = calculatePayroll(context);
      expect(result.taxable_compensation.toNumber()).toBe(0);
      expect(result.withholding_tax.toNumber()).toBe(0);
    });

    it("only MWE-exempt earnings", () => {
      calculateAttendanceBasedPay.mockReturnValue({
        earnings: [{ type: 'Basic Pay', amount: new Decimal(10000), is_taxable: true }],
        deductions: []
      });
      const context = createContext(true);
      const result = calculatePayroll(context);
      expect(result.taxable_compensation.toNumber()).toBe(0);
      expect(result.withholding_tax.toNumber()).toBe(0);
    });

    it("tax_applicable = false bypasses tax completely", () => {
      calculateAttendanceBasedPay.mockReturnValue({
        earnings: [{ type: 'Basic Pay', amount: new Decimal(100000), is_taxable: true }],
        deductions: []
      });
      const context = createContext(false, false); // is_mwe=false, tax_applicable=false
      const result = calculatePayroll(context);
      
      expect(result.taxable_compensation.toNumber()).toBe(100000); // It's still taxable compensation
      expect(result.withholding_tax.toNumber()).toBe(0); // But no tax was deducted
    });

    it("missing tax configuration throws error", () => {
      calculateAttendanceBasedPay.mockReturnValue({
        earnings: [{ type: 'Basic Pay', amount: new Decimal(20000), is_taxable: true }],
        deductions: []
      });
      const context = createContext(false);
      context.taxConfig = null;
      
      expect(() => calculatePayroll(context)).toThrow(/Missing Tax Configuration/);
    });
  });
});
