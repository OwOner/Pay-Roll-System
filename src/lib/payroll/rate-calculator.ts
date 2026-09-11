import Decimal from "decimal.js";
import { EmployeeCompensation } from "./types";

export interface WorkPolicy {
  scheduled_hours_per_day: number;
  scheduled_days_per_week: number;
  rest_days: string[];
  rest_days_paid: boolean;
  daily_rate_method: string;
  annualization_factor: number | null;
  ot_enabled: boolean;
  requires_ot_approval: boolean;
  ut_deduction_enabled: boolean;
  night_differential_enabled: boolean;
  custom_day_rules: any;
}

export const DEFAULT_WORK_POLICY: WorkPolicy = {
  scheduled_hours_per_day: 8,
  scheduled_days_per_week: 5,
  rest_days: ["Sunday"],
  rest_days_paid: false,
  daily_rate_method: "actual_days_worked",
  annualization_factor: 261,
  ot_enabled: true,
  requires_ot_approval: false,
  ut_deduction_enabled: true,
  night_differential_enabled: true,
  custom_day_rules: {}
};

export interface CalculatedRates {
  baseHourlyRate: Decimal;
  baseDailyRate: Decimal;
}

/**
 * Derives the precise hourly and daily rates from the employee's compensation basis and work policy.
 *
 * Rules:
 *  - Uses `salary_basis` explicitly — no implicit fallbacks.
 *  - Monthly: uses `basic_salary` + `policy.annualization_factor` (never a hardcoded divisor).
 *  - Daily: uses `daily_rate` directly.
 *  - Weekly: uses `weekly_rate` ÷ `scheduled_days_per_week`.
 *  - Hourly: uses `hourly_rate` directly.
 *  - Missing/null salary_basis → throws a clear, actionable error.
 */
export function deriveHourlyRate(
  comp: EmployeeCompensation,
  policy: WorkPolicy
): CalculatedRates {
  const hoursPerDay = new Decimal(policy.scheduled_hours_per_day || 8);

  switch (comp.salary_basis) {

    case 'Monthly': {
      if (!comp.basic_salary || comp.basic_salary.isZero()) {
        throw new Error(
          `Monthly employee has no basic salary set. Update their compensation record.`
        );
      }
      if (!policy.annualization_factor) {
        throw new Error(
          `Monthly salary requires an annualization factor from the Work Policy ` +
          `(e.g. 261 or 313 days). Assign a Work Policy to this employee or their position.`
        );
      }
      // Equivalent Daily Rate: (monthly × 12) ÷ annualization_factor
      // Factor comes from the resolved Work Policy — never hardcoded here.
      const factor = new Decimal(policy.annualization_factor);
      const edr = comp.basic_salary.mul(12).div(factor);
      return {
        baseHourlyRate: edr.div(hoursPerDay),
        baseDailyRate: edr,
      };
    }

    case 'Daily': {
      if (!comp.daily_rate || comp.daily_rate.isZero()) {
        throw new Error(
          `Daily employee has no daily rate set. Update their compensation record.`
        );
      }
      return {
        baseHourlyRate: comp.daily_rate.div(hoursPerDay),
        baseDailyRate: comp.daily_rate,
      };
    }

    case 'Weekly': {
      const wr = comp.weekly_rate;
      if (!wr || wr.isZero()) {
        throw new Error(
          `Weekly employee has no weekly rate set. Update their compensation record.`
        );
      }
      const daysPerWeek = new Decimal(policy.scheduled_days_per_week || 5);
      const edr = wr.div(daysPerWeek);
      return {
        baseHourlyRate: edr.div(hoursPerDay),
        baseDailyRate: edr,
      };
    }

    case 'Hourly': {
      if (!comp.hourly_rate || comp.hourly_rate.isZero()) {
        throw new Error(
          `Hourly employee has no hourly rate set. Update their compensation record.`
        );
      }
      return {
        baseHourlyRate: comp.hourly_rate,
        baseDailyRate: comp.hourly_rate.mul(hoursPerDay),
      };
    }

    default: {
      // salary_basis is null or an unrecognized legacy value.
      // Surface as a visible error instead of silently returning ₱0.
      const basis = (comp as any).salary_basis ?? (comp as any).salary_type ?? 'not set';
      throw new Error(
        `Cannot calculate payroll: salary basis "${basis}" is invalid or unrecognized. ` +
        `Open the employee's Compensation tab and update their Salary Basis ` +
        `(Monthly, Daily, Weekly, or Hourly).`
      );
    }
  }
}
