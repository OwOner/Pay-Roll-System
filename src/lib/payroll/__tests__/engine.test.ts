import { calculatePayroll } from "../engine";
import { PayrollContext } from "../types";
import Decimal from "decimal.js";

function getBaseContext(): PayrollContext {
  return {
    employee: {
      id: "emp-1",
      first_name: "Juan",
      last_name: "Dela Cruz",
      employment_type: "Regular",
      history: [
        {
          id: "comp-1",
          effective_from: "2026-01-01",
          effective_to: null,
          salary_basis: "Monthly" as const,
          salary_type: "Monthly",
          basic_salary: new Decimal(30000),
          daily_rate: new Decimal(0),
        }
      ]
    },
    period: {
      id: "period-1",
      period_start: "2026-09-01",
      period_end: "2026-09-15",
      pay_frequency: "Semi-Monthly"
    },
    attendance: [
      {
        id: "att-1",
        record_date: "2026-09-01",
        regular_hours_worked: new Decimal(8), // 1 day
        overtime_hours: new Decimal(0),
        night_differential_hours: new Decimal(0),
        is_rest_day: false,
        status: "Present"
      }
    ],
    leaves: [],
    holidays: [],
    adjustments: [],
    
    // Configs
    taxConfig: {
      id: "tax-table-1",
      name: "BIR Annex E (Semi-Monthly)",
      brackets: [
        {
          id: "bracket-1",
          pay_frequency: "Semi-Monthly",
          minimum_income: new Decimal(0),
          maximum_income: new Decimal(10417),
          base_tax: new Decimal(0),
          excess_rate: new Decimal(0)
        },
        {
          id: "bracket-2",
          pay_frequency: "Semi-Monthly",
          minimum_income: new Decimal(10417),
          maximum_income: new Decimal(16667),
          base_tax: new Decimal(0),
          excess_rate: new Decimal(0.15) // 15% in excess of 10417
        }
      ]
    },
    sssConfig: {
      id: "sss-table-1",
      brackets: [
        {
          id: "sss-bracket-1",
          minimum_compensation: new Decimal(0),
          maximum_compensation: null, // Catch-all for tests
          monthly_salary_credit: new Decimal(30000),
          regular_ss_employee: new Decimal(1350), // Example 4.5% of 30000
          regular_ss_employer: new Decimal(2550), // Example 8.5% of 30000
          mpf_employee: new Decimal(0),
          mpf_employer: new Decimal(0),
          ec_employer: new Decimal(30)
        }
      ]
    },
    philhealthConfig: {
      id: "ph-table-1",
      premium_rate: new Decimal(0.05), // 5%
      floor_mbs: new Decimal(10000),
      ceiling_mbs: new Decimal(100000)
    },
    pagibigConfig: {
      id: "pagibig-table-1",
      employee_rate_low: new Decimal(0.01),
      employee_rate_high: new Decimal(0.02),
      salary_threshold: new Decimal(1500),
      employer_rate: new Decimal(0.02),
      max_compensation: new Decimal(5000) // Caps basis at 5000
    },
    activePolicy: {
      id: "policy-1",
      name: "Standard",
      scheduled_hours_per_day: 8,
      scheduled_days_per_week: 6,
      rest_days: ["Sunday"],
      rest_days_paid: false,
      daily_rate_method: "annualized_312",
      annualization_factor: 312,
      custom_day_rules: {}
    },
    statutoryApplicability: {
      sss: true,
      philhealth: true,
      pagibig: true
    },
    statutoryAllocation: {
      sss_percentage: new Decimal(100),
      philhealth_percentage: new Decimal(100),
      pagibig_percentage: new Decimal(100)
    },
    cumulativeStatutoryDeductions: {
      sss: new Decimal(0),
      philhealth: new Decimal(0),
      pagibig: new Decimal(0)
    },
    timesheet: {
      id: "ts-1",
      employee_id: "emp-1",
      period_start: "2026-09-01",
      period_end: "2026-09-15",
      total_regular_hours: new Decimal(8),
      total_recorded_ot_hours: new Decimal(0),
      total_payable_ot_hours: new Decimal(0),
      total_recorded_ut_hours: new Decimal(0),
      total_payable_ut_hours: new Decimal(0),
      absent_days: new Decimal(0),
      status: "Approved",
      details: [
        {
          id: "tsd-1",
          timesheet_id: "ts-1",
          date: "2026-09-01",
          day_type: "Regular Workday",
          scheduled_hours: new Decimal(8),
          regular_hours: new Decimal(8),
          recorded_ot_hours: new Decimal(0),
          approved_ot_hours: new Decimal(0),
          payable_ot_hours: new Decimal(0),
          recorded_ut_hours: new Decimal(0),
          excused_ut_hours: new Decimal(0),
          payable_ut_hours: new Decimal(0)
        }
      ]
    }
  };
}

describe("Payroll Calculation Engine", () => {
  
  test("Test 1 — No deductions (or minimal base logic)", () => {
    const ctx = getBaseContext();
    const result = calculatePayroll(ctx, ctx.activePolicy);
    
    expect(result.gross_pay.toDecimalPlaces(2).toString()).toBe("1153.85");
    expect(result.earnings.length).toBe(1);
    expect(result.earnings[0].type).toBe("Basic Pay");
  });

  test("Test 2 — Overtime", () => {
    const ctx = getBaseContext();
    ctx.timesheet!.details[0].payable_ot_hours = new Decimal(2); 
    
    const result = calculatePayroll(ctx, ctx.activePolicy);
    
    expect(result.gross_pay.toDecimalPlaces(2).toString()).toBe("1514.42");
    
    const otEarning = result.earnings.find(e => e.type === "Overtime");
    expect(otEarning).toBeDefined();
    expect(otEarning?.amount.toDecimalPlaces(2).toString()).toBe("360.58");
  });

  test("Test 4 — Paid Leave", () => {
    const ctx = getBaseContext();
    ctx.timesheet!.details = []; 
    ctx.adjustments = [
      {
        id: "adj-2",
        type: "Earning",
        description: "Paid Leave",
        amount: new Decimal(1153.85),
        is_taxable: true,
        status: "Approved",
        employee_id: "emp-1"
      } as any
    ];

    const result = calculatePayroll(ctx, ctx.activePolicy);
    
    expect(result.gross_pay.toDecimalPlaces(2).toString()).toBe("1153.85");
    const leaveEarning = result.earnings.find(e => e.description === "Paid Leave");
    expect(leaveEarning).toBeDefined();
  });

  test("Test 5 — PhilHealth (uses MBS, ignores Overtime)", () => {
    const ctx = getBaseContext();
    ctx.timesheet!.details[0].regular_hours = new Decimal(160); 
    ctx.timesheet!.details[0].payable_ot_hours = new Decimal(10);

    const result = calculatePayroll(ctx, ctx.activePolicy);
    
    // Philhealth should only look at MBS (30000)
    // 30000 * 0.05 = 1500 total -> 750 employee, 750 employer
    
    expect(result.philhealth_employee.toDecimalPlaces(0).toString()).toBe("750");
    expect(result.philhealth_employer.toDecimalPlaces(0).toString()).toBe("750");
  });

  test("Test 8 — Taxable vs Non-taxable", () => {
    const ctx = getBaseContext();
    ctx.timesheet!.details[0].regular_hours = new Decimal(160);
    ctx.adjustments = [
      {
        id: "adj-1",
        type: "Earning",
        description: "De Minimis",
        amount: new Decimal(1500),
        is_taxable: false,
        status: "Approved",
        employee_id: "emp-1"
      } as any
    ];

    const result = calculatePayroll(ctx, ctx.activePolicy);
    
    expect(result.non_taxable_compensation.toString()).toBe("1500");
    
    const mandatory = result.total_employee_deductions;
    const taxableEarningsOnly = result.gross_pay.sub(1500); 
    
    expect(result.gross_pay.sub(1500).sub(result.sss_employee).sub(result.philhealth_employee).sub(result.pagibig_employee).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString())
      .toBe(result.taxable_compensation.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString());
  });

  test("Test 9, 11 — Employer vs Employee contributions", () => {
    const ctx = getBaseContext();
    const result = calculatePayroll(ctx, ctx.activePolicy);
    
    expect(result.sss_ec.toDecimalPlaces(0).toString()).toBe("30"); // EC is 30
    
    expect(result.total_employer_contributions.toString()).toBe(
      result.sss_employer.plus(result.sss_ec).plus(result.philhealth_employer).plus(result.pagibig_employer).toString()
    );
    
    expect(result.net_pay.toString()).toBe("0");
  });

  test("Test 12 — Payroll period boundary", () => {
    const ctx = getBaseContext();
    ctx.employee.history.push({
      id: "comp-2",
      effective_from: "2026-09-10",
      effective_to: null,
      salary_basis: "Monthly" as const,
      salary_type: "Monthly",
      basic_salary: new Decimal(40000),
      daily_rate: new Decimal(1538.46)
    });
    
    ctx.employee.history[0].effective_to = "2026-09-09";
    
    ctx.timesheet!.details = [
      {
        id: "tsd-1",
        timesheet_id: "ts-1",
        date: "2026-09-05",
        day_type: "Regular Workday",
        scheduled_hours: new Decimal(8),
        regular_hours: new Decimal(8),
        recorded_ot_hours: new Decimal(0),
        approved_ot_hours: new Decimal(0),
        payable_ot_hours: new Decimal(0),
        recorded_ut_hours: new Decimal(0),
        excused_ut_hours: new Decimal(0),
        payable_ut_hours: new Decimal(0)
      },
      {
        id: "tsd-2",
        timesheet_id: "ts-1",
        date: "2026-09-12",
        day_type: "Regular Workday",
        scheduled_hours: new Decimal(8),
        regular_hours: new Decimal(8),
        recorded_ot_hours: new Decimal(0),
        approved_ot_hours: new Decimal(0),
        payable_ot_hours: new Decimal(0),
        recorded_ut_hours: new Decimal(0),
        excused_ut_hours: new Decimal(0),
        payable_ut_hours: new Decimal(0)
      }
    ];

    const result = calculatePayroll(ctx, ctx.activePolicy);
    
    const expected = new Decimal(1153.8461538461538).plus(1538.4615384615386);
    expect(result.gross_pay.toDecimalPlaces(2).toString()).toBe(expected.toDecimalPlaces(2).toString());
  });

  test("Test 13 — Configuration snapshot boundary", () => {
    const ctx = getBaseContext();
    const result1 = calculatePayroll(ctx, ctx.activePolicy);
    expect(result1.snapshots.taxTableId).toBe("tax-table-1");
    
    ctx.taxConfig!.id = "tax-table-2";
    const result2 = calculatePayroll(ctx, ctx.activePolicy);
    
    expect(result1.snapshots.taxTableId).toBe("tax-table-1"); 
    expect(result2.snapshots.taxTableId).toBe("tax-table-2");
  });
});
