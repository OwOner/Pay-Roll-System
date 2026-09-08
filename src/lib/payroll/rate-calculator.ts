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

export interface CalculatedRates {
  baseHourlyRate: Decimal;
  baseDailyRate: Decimal;
}

/**
 * Derives the precise hourly rate based on the employee's compensation basis and work policy.
 */
export function deriveHourlyRate(
  comp: EmployeeCompensation,
  policy: WorkPolicy
): CalculatedRates {
  const hoursPerDay = new Decimal(policy.scheduled_hours_per_day || 8);

  // If Hourly rate is explicitly set in DB (rare in PH but possible)
  if (comp.salary_type === 'Hourly' && comp.hourly_rate) {
    return {
      baseHourlyRate: comp.hourly_rate,
      baseDailyRate: comp.hourly_rate.mul(hoursPerDay)
    };
  }

  // If Daily rate is set
  if (comp.salary_type === 'Daily' && comp.daily_rate) {
    return {
      baseHourlyRate: comp.daily_rate.div(hoursPerDay),
      baseDailyRate: comp.daily_rate
    };
  }

  // If Monthly rate
  if (comp.salary_type === 'Monthly' && comp.basic_salary) {
    // Requires an annualization factor
    if (!policy.annualization_factor) {
      throw new Error(`Monthly employee requires a valid annualization_factor in their Work Policy. Currently using ${policy.daily_rate_method}.`);
    }
    
    // Equivalent Daily Rate (EDR) = (Monthly * 12) / Factor
    const factor = new Decimal(policy.annualization_factor);
    const edr = comp.basic_salary.mul(12).div(factor);
    
    return {
      baseHourlyRate: edr.div(hoursPerDay),
      baseDailyRate: edr
    };
  }
  
  // If Weekly rate
  if (comp.salary_type === 'Weekly' && comp.basic_salary) {
    // If weekly_preserved is used, we need to know how many days they work in a week
    const daysPerWeek = new Decimal(policy.scheduled_days_per_week || 5);
    const edr = comp.basic_salary.div(daysPerWeek);
    return {
      baseHourlyRate: edr.div(hoursPerDay),
      baseDailyRate: edr
    };
  }

  throw new Error(`Unable to determine hourly rate for compensation type: ${comp.salary_type}`);
}
