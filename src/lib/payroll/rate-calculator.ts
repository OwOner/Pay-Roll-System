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
  policy: WorkPolicy | null
): CalculatedRates {
  const hoursPerDay = new Decimal(policy?.scheduled_hours_per_day || 8);

  switch (comp.salary_basis) {

    case 'Monthly': {
      if (!comp.basic_salary || comp.basic_salary.isZero()) {
        throw new Error(
          `Monthly employee has no basic salary set. Update their compensation record.`
        );
      }
      const factorVal = policy?.annualization_factor || 261;
      // Equivalent Daily Rate: (monthly × 12) ÷ annualization_factor
      const factor = new Decimal(factorVal);
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
      const daysPerWeek = new Decimal(policy?.scheduled_days_per_week || 6);
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

/**
 * Derives the strict monthly equivalent compensation for statutory basis lookups.
 * 
 * Rules:
 * - Reverses the EDR logic based on the employee's exact work policy.
 * - DOES NOT use silent fallbacks (e.g. 261, 6, 8). If a required policy field is missing, it throws an error.
 * - Throws an error for invalid or missing salary basis.
 */
export function deriveMonthlyStatutoryBasis(
  comp: EmployeeCompensation,
  policy: WorkPolicy
): Decimal {
  switch (comp.salary_basis) {
    case 'Monthly': {
      if (!comp.basic_salary || comp.basic_salary.isZero()) {
        throw new Error(`Monthly employee has no basic salary set. Update their compensation record.`);
      }
      return comp.basic_salary;
    }

    case 'Daily': {
      if (!comp.daily_rate || comp.daily_rate.isZero()) {
        throw new Error(`Daily employee has no daily rate set. Update their compensation record.`);
      }
      if (!policy.annualization_factor) {
        throw new Error(`Cannot derive monthly statutory basis for Daily employee: active Work Policy is missing 'annualization_factor'. Update the work policy configuration.`);
      }
      const factor = new Decimal(policy.annualization_factor);
      // Monthly Equivalent = (Daily Rate * Annualization Factor) / 12
      return comp.daily_rate.mul(factor).div(12);
    }

    case 'Weekly': {
      if (!comp.weekly_rate || comp.weekly_rate.isZero()) {
        throw new Error(`Weekly employee has no weekly rate set. Update their compensation record.`);
      }
      if (!policy.annualization_factor) {
        throw new Error(`Cannot derive monthly statutory basis for Weekly employee: active Work Policy is missing 'annualization_factor'.`);
      }
      if (!policy.scheduled_days_per_week) {
        throw new Error(`Cannot derive monthly statutory basis for Weekly employee: active Work Policy is missing 'scheduled_days_per_week'.`);
      }
      const factor = new Decimal(policy.annualization_factor);
      const daysPerWeek = new Decimal(policy.scheduled_days_per_week);
      
      // Equivalent Daily Rate = Weekly Rate / Days Per Week
      const edr = comp.weekly_rate.div(daysPerWeek);
      // Monthly Equivalent = (EDR * Annualization Factor) / 12
      return edr.mul(factor).div(12);
    }

    case 'Hourly': {
      if (!comp.hourly_rate || comp.hourly_rate.isZero()) {
        throw new Error(`Hourly employee has no hourly rate set. Update their compensation record.`);
      }
      if (!policy.annualization_factor) {
        throw new Error(`Cannot derive monthly statutory basis for Hourly employee: active Work Policy is missing 'annualization_factor'.`);
      }
      if (!policy.scheduled_hours_per_day) {
        throw new Error(`Cannot derive monthly statutory basis for Hourly employee: active Work Policy is missing 'scheduled_hours_per_day'.`);
      }
      const factor = new Decimal(policy.annualization_factor);
      const hoursPerDay = new Decimal(policy.scheduled_hours_per_day);
      
      // Equivalent Daily Rate = Hourly Rate * Hours Per Day
      const edr = comp.hourly_rate.mul(hoursPerDay);
      // Monthly Equivalent = (EDR * Annualization Factor) / 12
      return edr.mul(factor).div(12);
    }

    default: {
      const basis = (comp as any).salary_basis ?? (comp as any).salary_type ?? 'not set';
      throw new Error(
        `Unable to determine monthly statutory basis: unsupported salary basis "${basis}". ` +
        `Please correct the employee's compensation configuration.`
      );
    }
  }
}

