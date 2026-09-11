import Decimal from "decimal.js";

// -----------------------------------------------------------------------------
// ENUMS & PRIMITIVES
// -----------------------------------------------------------------------------
export type PayFrequency = "Daily" | "Weekly" | "Semi-Monthly" | "Monthly";
export type EmploymentType = "Regular" | "Probationary" | "Contractual" | "Part-Time";
export type EarningType = "Basic Pay" | "Paid Leave" | "Overtime" | "Holiday Pay" | "Rest Day Pay" | "Night Differential" | "Allowance" | "Bonus" | "13th Month Pay" | "Other";
export type DeductionType = "SSS" | "PhilHealth" | "Pag-IBIG" | "Withholding Tax" | "Loan" | "Other";

// -----------------------------------------------------------------------------
// CONFIGURATION TYPES
// -----------------------------------------------------------------------------
export interface ConfigSnapshotInfo {
  taxTableId?: string;
  sssTableId?: string;
  philhealthTableId?: string;
  pagibigTableId?: string;
  holidayRuleVersion?: string;
}

export interface TaxBracket {
  id: string;
  pay_frequency: PayFrequency;
  minimum_income: Decimal;
  maximum_income: Decimal | null;
  base_tax: Decimal;
  excess_rate: Decimal;
}

export interface TaxTableConfig {
  id: string;
  name: string;
  brackets: TaxBracket[];
}

export interface SssBracket {
  id: string;
  minimum_compensation: Decimal;
  maximum_compensation: Decimal | null;
  monthly_salary_credit: Decimal;
  regular_ss_employee: Decimal;
  regular_ss_employer: Decimal;
  mpf_employee: Decimal;
  mpf_employer: Decimal;
  ec_employer: Decimal;
}

export interface SssConfig {
  id: string;
  brackets: SssBracket[];
}

export interface PhilhealthConfig {
  id: string;
  premium_rate: Decimal; // e.g., 0.05 for 5%
  floor_mbs: Decimal;    // e.g., 10000
  ceiling_mbs: Decimal;  // e.g., 100000
}

export interface PagibigConfig {
  id: string;
  employee_rate_low: Decimal;   // rate for MFS <= salary_threshold (e.g. 0.01)
  employee_rate_high: Decimal;  // rate for MFS > salary_threshold (e.g. 0.02)
  salary_threshold: Decimal;    // the split threshold (e.g. ₱1,500)
  employer_rate: Decimal;       // e.g. 0.02
  max_compensation: Decimal;    // MFS ceiling (e.g. ₱10,000)
}

// -----------------------------------------------------------------------------
// PAYROLL CONTEXT
// -----------------------------------------------------------------------------
export interface PayrollPeriod {
  id: string;
  period_start: string; // YYYY-MM-DD
  period_end: string;   // YYYY-MM-DD
  pay_frequency: PayFrequency;
}

export interface EmployeeCompensation {
  id: string;
  effective_from: string;
  effective_to: string | null;
  /** The pay rate basis — what the rate number represents. */
  salary_basis: "Monthly" | "Daily" | "Weekly" | "Hourly";
  /** @deprecated Use salary_basis. Kept for DB backward compatibility. */
  salary_type?: string;
  /** Monthly salary (PHP). Authoritative when salary_basis = 'Monthly'. */
  basic_salary: Decimal;
  /** Daily rate (PHP). Authoritative when salary_basis = 'Daily'. */
  daily_rate: Decimal;
  /** Weekly rate (PHP). Authoritative when salary_basis = 'Weekly'. */
  weekly_rate?: Decimal;
  /** Hourly rate (PHP). Authoritative when salary_basis = 'Hourly'. */
  hourly_rate?: Decimal;
}

export interface EmployeeData {
  id: string;
  first_name: string;
  last_name: string;
  employment_type: EmploymentType;
  history: EmployeeCompensation[];
}

export interface AttendanceRecord {
  id: string;
  record_date: string;
  regular_hours_worked: Decimal;
  overtime_hours: Decimal;
  night_differential_hours: Decimal;
  is_rest_day: boolean;
  status: string;
}

export interface TimesheetDetail {
  id: string;
  timesheet_id: string;
  date: string;
  day_type: string;
  scheduled_hours: Decimal;
  regular_hours: Decimal;
  recorded_ot_hours: Decimal;
  approved_ot_hours: Decimal;
  payable_ot_hours: Decimal;
  recorded_ut_hours: Decimal;
  excused_ut_hours: Decimal;
  payable_ut_hours: Decimal;
}

export interface Timesheet {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  total_regular_hours: Decimal;
  total_recorded_ot_hours: Decimal;
  total_payable_ot_hours: Decimal;
  total_recorded_ut_hours: Decimal;
  total_payable_ut_hours: Decimal;
  absent_days: Decimal;
  status: string;
  details?: TimesheetDetail[];
}

export interface LeaveRecord {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: Decimal;
  is_paid: boolean;
  status: string; // Should be 'Approved'
}

export interface HolidayRecord {
  id: string;
  date: string;
  name: string;
  type: "Regular" | "Special Non-Working";
  multiplier: Decimal;
}

export interface ManualAdjustment {
  id: string;
  type: "Earning" | "Deduction";
  description: string;
  amount: Decimal;
  is_taxable?: boolean;
}

export interface PayrollOverride {
  type: EarningType | DeductionType;
  description: string;
  overridden_amount: Decimal;
  override_reason: string;
}

/**
 * The unified context object containing all required inputs to run a deterministic calculation
 * for a single employee in a single payroll period.
 */
export interface PayrollContext {
  employee: EmployeeData;
  period: PayrollPeriod;
  attendance: AttendanceRecord[];
  timesheet: Timesheet; // Authoritative source for hours and absences
  leaves: LeaveRecord[];
  holidays: HolidayRecord[];
  adjustments: ManualAdjustment[];
  overrides?: PayrollOverride[];
  
  // Official Configurations
  taxConfig: TaxTableConfig | null;
  sssConfig: SssConfig | null;
  philhealthConfig: PhilhealthConfig | null;
  pagibigConfig: PagibigConfig | null;
  activePolicy: any; // Add activePolicy directly to context
  statutoryApplicability: {
    sss: boolean;
    philhealth: boolean;
    pagibig: boolean;
  };
}

// -----------------------------------------------------------------------------
// CALCULATION RESULTS
// -----------------------------------------------------------------------------
export interface EarningResult {
  type: EarningType;
  description: string;
  amount: Decimal; // The effective final amount
  calculated_amount?: Decimal; // Original engine calculation
  overridden_amount?: Decimal; // If manual override was applied
  override_reason?: string;
  is_taxable: boolean;
  is_sss_covered: boolean;
  is_philhealth_covered: boolean;
  is_pagibig_covered: boolean;
  source?: string;
  source_id?: string;
}

export interface DeductionResult {
  type: DeductionType;
  description: string;
  amount: Decimal; // The effective final amount
  calculated_amount?: Decimal; // Original engine calculation
  overridden_amount?: Decimal; // If manual override was applied
  override_reason?: string;
  employer_amount?: Decimal; // EC, MPF Employer, etc. Do not deduct from net.
  
  // Tax & Statutory Flags
  is_pre_tax?: boolean; // Does this reduce taxable compensation? (e.g. Absences, Statutory)
  is_sss_deductible?: boolean; // Does this reduce SSS basis?
  is_philhealth_deductible?: boolean; // Does this reduce PhilHealth basis?
  is_pagibig_deductible?: boolean; // Does this reduce Pag-IBIG basis?

  source?: string;
  source_id?: string;
}

export interface PayrollCalculationResult {
  employee_id: string;
  payroll_period_id: string;
  
  // Breakdown
  earnings: EarningResult[];
  deductions: DeductionResult[];
  
  // Aggregates
  gross_pay: Decimal;
  taxable_compensation: Decimal;
  non_taxable_compensation: Decimal;
  total_employee_deductions: Decimal;
  total_employer_contributions: Decimal;
  net_pay: Decimal;
  
  // Statutory Details (for easy mapping)
  sss_employee: Decimal;
  sss_employer: Decimal;
  sss_ec: Decimal;
  philhealth_employee: Decimal;
  philhealth_employer: Decimal;
  pagibig_employee: Decimal;
  pagibig_employer: Decimal;
  withholding_tax: Decimal;
  
  // Metadata
  calculation_engine_version: string;
  snapshots: ConfigSnapshotInfo;
}
