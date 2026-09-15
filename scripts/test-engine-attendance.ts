import { calculatePayroll } from "./src/lib/payroll/engine";
import { PayrollContext } from "./src/lib/payroll/types";
import Decimal from "decimal.js";

// Mock configurations
const mockTaxConfig = {
  id: "tax-1",
  name: "2024 Tax",
  brackets: [
    {
      id: "tb-1",
      pay_frequency: "Semi-Monthly" as const,
      minimum_income: new Decimal(0),
      maximum_income: new Decimal(10417),
      base_tax: new Decimal(0),
      excess_rate: new Decimal(0)
    }
  ]
};

const mockSssConfig = {
  id: "sss-1",
  brackets: [
    {
      id: "sb-1",
      minimum_compensation: new Decimal(0),
      maximum_compensation: new Decimal(99999),
      monthly_salary_credit: new Decimal(15000),
      regular_ss_employee: new Decimal(675),
      regular_ss_employer: new Decimal(1425),
      mpf_employee: new Decimal(0),
      mpf_employer: new Decimal(0),
      ec_employer: new Decimal(30)
    }
  ]
};

const mockPhilhealthConfig = {
  id: "ph-1",
  premium_rate: new Decimal(0.05),
  floor_mbs: new Decimal(10000),
  ceiling_mbs: new Decimal(100000)
};

const mockPagibigConfig = {
  id: "pag-1",
  employee_rate_low: new Decimal(0.01),
  employee_rate_high: new Decimal(0.02),
  salary_threshold: new Decimal(1500),
  employer_rate: new Decimal(0.02),
  max_compensation: new Decimal(10000)
};

const baseContext: any = {
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

function runTest(name: string, contextOverrides: any) {
  console.log(`\n=== TEST: ${name} ===`);
  const ctx = { ...baseContext, ...contextOverrides };
  try {
    const result = calculatePayroll(ctx, { id: "policy-1", name: "Standard", scheduled_hours_per_day: 8, scheduled_days_per_week: 5, rest_days: ["Saturday", "Sunday"], rest_days_paid: false, daily_rate_method: "annualized_261", annualization_factor: 261, custom_day_rules: {} } as any);
    console.log(`Gross Pay: ${result.gross_pay.toString()}`);
    console.log(`Taxable Comp: ${result.taxable_compensation.toString()}`);
    console.log(`Total Deductions: ${result.total_employee_deductions.toString()}`);
    console.log(`Net Pay: ${result.net_pay.toString()}`);
    
    console.log("Earnings:");
    result.earnings.forEach(e => console.log(` - ${e.description}: ${e.amount.toString()}`));
    console.log("Deductions:");
    result.deductions.forEach(d => console.log(` - ${d.description}: ${d.amount.toString()}`));
  } catch (e: any) {
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
      basic_salary: new Decimal(30000),
      daily_rate: new Decimal(1153.85)
    }]
  },
  timesheet: {
    id: "ts-1",
    absent_days: new Decimal(0),
    late_undertime_hours: new Decimal(0),
    total_regular_hours: new Decimal(88),
    total_overtime_hours: new Decimal(0)
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
      basic_salary: new Decimal(30000), // Semi-monthly gross is 15000
      daily_rate: new Decimal(1000)
    }]
  },
  timesheet: {
    id: "ts-2",
    absent_days: new Decimal(1), // Should deduct 1000
    late_undertime_hours: new Decimal(0),
    total_regular_hours: new Decimal(80),
    total_overtime_hours: new Decimal(0)
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
      basic_salary: new Decimal(0),
      daily_rate: new Decimal(500)
    }]
  },
  timesheet: {
    id: "ts-3",
    absent_days: new Decimal(0),
    late_undertime_hours: new Decimal(0),
    total_regular_hours: new Decimal(80), // 10 days * 8 hours
    total_overtime_hours: new Decimal(0)
  }
});
