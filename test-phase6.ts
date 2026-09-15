import Decimal from "decimal.js";
import { calculatePayroll } from "./src/lib/payroll/engine";
import { PayrollContext, EmployeeData, PayrollPeriod, Timesheet, CashAdvance } from "./src/lib/payroll/types";
import { DEFAULT_WORK_POLICY, deriveMonthlyStatutoryBasis } from "./src/lib/payroll/rate-calculator";

async function runTests() {
  console.log("--- PHASE 6A TASK 1 TESTS ---\n");
  
  const baseEmployee: EmployeeData = {
    id: "emp-1",
    first_name: "Test",
    last_name: "Employee",
    employment_type: "Regular",
    history: [{
      id: "comp-1",
      effective_from: "2026-01-01",
      effective_to: null,
      salary_basis: "Daily",
      daily_rate: new Decimal(1000),
      basic_salary: new Decimal(0)
    }]
  };

  const period: PayrollPeriod = {
    id: "per-1",
    period_start: "2026-09-01",
    period_end: "2026-09-07",
    pay_frequency: "Weekly"
  };

  const timesheet: Timesheet = {
    id: "ts-1",
    employee_id: "emp-1",
    period_start: "2026-09-01",
    period_end: "2026-09-07",
    total_regular_hours: new Decimal(40),
    total_recorded_ot_hours: new Decimal(0),
    total_payable_ot_hours: new Decimal(0),
    total_recorded_ut_hours: new Decimal(0),
    total_payable_ut_hours: new Decimal(0),
    absent_days: new Decimal(0),
    status: "Approved",
    details: [] // Remove details to bypass attendance calculation which requires full day-rules mock
  };

  const context: PayrollContext = {
    employee: baseEmployee,
    period,
    attendance: [],
    timesheet,
    leaves: [],
    holidays: [],
    adjustments: [
      { id: "adj-1", type: "Earning", description: "Mock Salary", amount: new Decimal(5000), is_taxable: true }
    ],
    taxConfig: null, // Test tax later
    sssConfig: {
      id: "sss-conf",
      brackets: [{
        id: "b1",
        minimum_compensation: new Decimal(0),
        maximum_compensation: new Decimal(50000),
        monthly_salary_credit: new Decimal(20000),
        regular_ss_employee: new Decimal(1000), // 1000 employee obligation
        regular_ss_employer: new Decimal(2000),
        mpf_employee: new Decimal(0),
        mpf_employer: new Decimal(0),
        ec_employer: new Decimal(30)
      }]
    },
    philhealthConfig: null,
    pagibigConfig: null,
    activePolicy: DEFAULT_WORK_POLICY,
    statutoryApplicability: { sss: true, philhealth: false, pagibig: false, tax: true },
    statutoryAllocation: {
      sss_percentage: new Decimal(25), // 25% per week
      philhealth_percentage: new Decimal(0),
      pagibig_percentage: new Decimal(0)
    },
    cumulativeStatutoryDeductions: {
      sss: new Decimal(0),
      philhealth: new Decimal(0),
      pagibig: new Decimal(0)
    }
  };

  // Test 1: deriveMonthlyStatutoryBasis Missing Config
  try {
    const invalidComp = { ...baseEmployee.history[0], salary_basis: "Daily" as any };
    deriveMonthlyStatutoryBasis(invalidComp, { ...DEFAULT_WORK_POLICY, annualization_factor: null });
    console.error("❌ Test 1 Failed: Should throw error on missing annualization_factor for Daily.");
  } catch (e: any) {
    if (e.message.includes("missing 'annualization_factor'")) {
      console.log("✅ Test 1 Passed: Throws error on missing annualization_factor.");
    } else {
      console.error("❌ Test 1 Failed with unexpected error:", e.message);
    }
  }

  // Test 2: Weekly Allocation capping (Week 5 Over-deduction prevention)
  // Let's say we are on Week 5, meaning cumulative SSS is already 1000 (from 4 weeks * 250)
  const week5Context = {
    ...context,
    cumulativeStatutoryDeductions: {
      sss: new Decimal(1000), // Max reached
      philhealth: new Decimal(0),
      pagibig: new Decimal(0)
    }
  };

  const resWeek5 = calculatePayroll(week5Context, DEFAULT_WORK_POLICY);
  if (resWeek5.sss_employee.equals(0)) {
    console.log("✅ Test 2 Passed: 5th Week correctly deducts 0 SSS, capped at obligation.");
  } else {
    console.error("❌ Test 2 Failed: Deducted SSS when it should be 0. Got:", resWeek5.sss_employee.toString());
  }

  // Test 3: Weekly Allocation normally (Week 1)
  const resWeek1 = calculatePayroll(context, DEFAULT_WORK_POLICY);
  if (resWeek1.sss_employee.equals(250)) {
    console.log("✅ Test 3 Passed: 1st Week correctly deducts 25% (250).");
  } else {
    console.error("❌ Test 3 Failed: Deducted incorrect SSS. Got:", resWeek1.sss_employee.toString());
  }

  // Test 4: Net Pay Cash Advance Clamping
  // Let's create a huge cash advance that exceeds net pay.
  // Gross pay for 5 days * 1000 = 5000.
  // SSS deduction = 250. Available Net = 4750.
  // We'll set Cash Advance repayment to 10000.
  const caContext: PayrollContext = {
    ...context,
    cashAdvances: [{
      id: "ca-1",
      amount: new Decimal(20000),
      remaining_balance: new Decimal(20000),
      repayment_amount_per_payroll: new Decimal(10000) // Huge repayment
    }]
  };

  const resCA = calculatePayroll(caContext, DEFAULT_WORK_POLICY);
  const loanDeductions = resCA.deductions.filter(d => d.type === "Loan");
  const loanTotal = loanDeductions.reduce((acc, d) => acc.plus(d.amount), new Decimal(0));
  
  if (loanTotal.equals(4750) && resCA.net_pay.equals(0)) {
    console.log("✅ Test 4 Passed: Cash Advance is correctly clamped to 4750, leaving Net Pay at 0, while SSS stays 250.");
    console.log("   -> SSS:", resCA.sss_employee.toString(), "Loan:", loanTotal.toString());
  } else {
    console.error("❌ Test 4 Failed: Cash Advance not clamped correctly. Net Pay:", resCA.net_pay.toString(), "Loan:", loanTotal.toString());
  }
}

runTests().catch(console.error);
