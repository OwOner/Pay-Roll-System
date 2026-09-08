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
          salary_type: "Monthly",
          basic_salary: new Decimal(30000),
          daily_rate: new Decimal(1153.85) // roughly 30000 / 26
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
      scheduled_days_per_week: 5,
      rest_days: ["Saturday", "Sunday"],
      rest_days_paid: false,
      daily_rate_method: "annualized_261",
      annualization_factor: 261,
      custom_day_rules: {}
    },
    statutoryApplicability: {
      sss: true,
      philhealth: true,
      pagibig: true
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
          day_type: "Regular",
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
    // 1 day worked = 1153.85
    // PhilHealth on 1153.85 MBS -> hits floor of 10000 * 5% = 500 total, 250 employee, 250 employer
    // SSS -> 1350 employee
    // Pagibig -> 1153.85 * 1% = 11.54 employee
    const result = calculatePayroll(ctx, ctx.activePolicy);
    
    expect(result.gross_pay.toString()).toBe("1153.85");
    expect(result.earnings.length).toBe(1);
    expect(result.earnings[0].type).toBe("Basic Pay");
  });

  test("Test 2 — Overtime", () => {
    const ctx = getBaseContext();
    ctx.attendance[0].overtime_hours = new Decimal(2); // 2 hours OT
    
    const result = calculatePayroll(ctx, ctx.activePolicy);
    
    // 1 day basic = 1153.85
    // 2 hours OT = (1153.85 / 8) * 1.25 * 2 = 144.23125 * 2 = 360.58
    // Gross = 1153.85 + 360.58 = 1514.43
    expect(result.gross_pay.toDecimalPlaces(2).toString()).toBe("1514.43");
    
    const otEarning = result.earnings.find(e => e.type === "Overtime");
    expect(otEarning).toBeDefined();
    expect(otEarning?.amount.toDecimalPlaces(2).toString()).toBe("360.58");
  });

  test("Test 4 — Paid Leave", () => {
    const ctx = getBaseContext();
    // 0 hours worked
    ctx.attendance = []; 
    ctx.leaves = [
      {
        id: "leave-1",
        leave_type: "Vacation",
        start_date: "2026-09-02",
        end_date: "2026-09-02",
        total_days: new Decimal(1),
        is_paid: true,
        status: "Approved"
      }
    ];

    const result = calculatePayroll(ctx, ctx.activePolicy);
    
    expect(result.gross_pay.toString()).toBe("1153.85");
    const leaveEarning = result.earnings.find(e => e.type === "Paid Leave");
    expect(leaveEarning).toBeDefined();
  });

  test("Test 5 — PhilHealth (uses MBS, ignores Overtime)", () => {
    const ctx = getBaseContext();
    ctx.attendance[0].regular_hours_worked = new Decimal(160); // Say, 20 days -> 23077 basic
    ctx.attendance[0].overtime_hours = new Decimal(10); // Some OT

    const result = calculatePayroll(ctx, ctx.activePolicy);
    
    // Philhealth should only look at Basic (23077)
    // 23077 * 0.05 = 1153.85 total -> 576.93 employee, 576.93 employer
    
    expect(result.philhealth_employee.toString()).toBe("576.93");
    expect(result.philhealth_employer.toString()).toBe("576.92"); // Subtraction of 576.93 from 1153.85
  });

  test("Test 8 — Taxable vs Non-taxable", () => {
    const ctx = getBaseContext();
    ctx.attendance[0].regular_hours_worked = new Decimal(160);
    ctx.adjustments = [
      {
        id: "adj-1",
        type: "Earning",
        description: "De Minimis",
        amount: new Decimal(1500),
        is_taxable: false
      }
    ];

    const result = calculatePayroll(ctx, ctx.activePolicy);
    
    // Gross includes De Minimis
    expect(result.non_taxable_compensation.toString()).toBe("1500");
    
    // Taxable doesn't
    const mandatory = result.total_employee_deductions;
    const taxableEarningsOnly = result.gross_pay.sub(1500); 
    const expectedTaxableComp = taxableEarningsOnly.sub(mandatory).toDecimalPlaces(2, Decimal.ROUND_HALF_UP); // if any rounding
    
    // Taxable Comp inside result shouldn't include the 1500
    // Engine subtracts mandatory from totalTaxableEarnings
    // So taxable_comp = totalTaxable - mandatory
    // Let's just ensure totalTaxable is strictly gross - nontaxable
    
    expect(result.gross_pay.sub(1500).sub(result.sss_employee).sub(result.philhealth_employee).sub(result.pagibig_employee).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString())
      .toBe(result.taxable_compensation.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString());
  });

  test("Test 9, 11 — Employer vs Employee contributions", () => {
    const ctx = getBaseContext();
    const result = calculatePayroll(ctx, ctx.activePolicy);
    
    expect(result.sss_ec.toString()).toBe("30"); // EC is 30
    
    // Ensure EC is in total_employer_contributions, not in total_employee_deductions
    expect(result.total_employer_contributions.toString()).toBe(
      result.sss_employer.plus(result.sss_ec).plus(result.philhealth_employer).plus(result.pagibig_employer).toString()
    );
    
    // Net pay must be Gross Pay - Employee Deductions (NOT employer deductions)
    expect(result.net_pay.toString()).toBe(
      result.gross_pay.sub(result.total_employee_deductions).toString()
    );
  });

  test("Test 12 — Payroll period boundary", () => {
    const ctx = getBaseContext();
    ctx.employee.history.push({
      id: "comp-2",
      effective_from: "2026-09-10",
      effective_to: null,
      salary_type: "Monthly",
      basic_salary: new Decimal(40000),
      daily_rate: new Decimal(1538.46)
    });
    
    // Fix comp-1 end date
    ctx.employee.history[0].effective_to = "2026-09-09";
    
    // Two attendance records, one before raise, one after
    ctx.attendance = [
      {
        id: "att-1",
        record_date: "2026-09-05",
        regular_hours_worked: new Decimal(8),
        overtime_hours: new Decimal(0),
        night_differential_hours: new Decimal(0),
        is_rest_day: false,
        status: "Present"
      },
      {
        id: "att-2",
        record_date: "2026-09-12",
        regular_hours_worked: new Decimal(8),
        overtime_hours: new Decimal(0),
        night_differential_hours: new Decimal(0),
        is_rest_day: false,
        status: "Present"
      }
    ];

    const result = calculatePayroll(ctx, ctx.activePolicy);
    
    // Gross = 1153.85 (att-1) + 1538.46 (att-2)
    const expected = new Decimal(1153.85).plus(1538.46);
    expect(result.gross_pay.toString()).toBe(expected.toString());
  });

  test("Test 13 — Configuration snapshot boundary", () => {
    const ctx = getBaseContext();
    const result1 = calculatePayroll(ctx, ctx.activePolicy);
    expect(result1.snapshots.taxTableId).toBe("tax-table-1");
    
    // Mutate config
    ctx.taxConfig.id = "tax-table-2";
    const result2 = calculatePayroll(ctx, ctx.activePolicy);
    
    expect(result1.snapshots.taxTableId).toBe("tax-table-1"); // Remains unchanged
    expect(result2.snapshots.taxTableId).toBe("tax-table-2");
  });

});
