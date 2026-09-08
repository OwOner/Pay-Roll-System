import Decimal from "decimal.js";

// DOLE Statutory Minimums (Multipliers)
// These represent the mathematical multipliers for different day types.
// https://bwc.dole.gov.ph/downloads/2024-Edition-Workers-Statutory-Monetary-Benefits-Handbook.pdf

export type DayType = 
  | 'Regular Workday'
  | 'Scheduled Rest Day'
  | 'Regular Holiday'
  | 'Special Non-Working Day'
  | 'Regular Holiday + Rest Day'
  | 'Special Non-Working Day + Rest Day';

export interface DayRule {
  baseMultiplier: Decimal;
  otMultiplier: Decimal; // Premium applied to the active hourly rate
  nightDifferentialMultiplier: Decimal;
}

export const STATUTORY_RULES: Record<DayType, DayRule> = {
  'Regular Workday': {
    baseMultiplier: new Decimal(1.00),
    otMultiplier: new Decimal(1.25),
    nightDifferentialMultiplier: new Decimal(1.10),
  },
  'Scheduled Rest Day': {
    baseMultiplier: new Decimal(1.30),
    otMultiplier: new Decimal(1.30),
    nightDifferentialMultiplier: new Decimal(1.10),
  },
  'Regular Holiday': {
    baseMultiplier: new Decimal(2.00),
    otMultiplier: new Decimal(1.30),
    nightDifferentialMultiplier: new Decimal(1.10),
  },
  'Regular Holiday + Rest Day': {
    baseMultiplier: new Decimal(2.60), // 2.00 * 1.30 = 2.60
    otMultiplier: new Decimal(1.30), // Applied to the 2.60 base
    nightDifferentialMultiplier: new Decimal(1.10),
  },
  'Special Non-Working Day': {
    baseMultiplier: new Decimal(1.30),
    otMultiplier: new Decimal(1.30),
    nightDifferentialMultiplier: new Decimal(1.10),
  },
  'Special Non-Working Day + Rest Day': {
    baseMultiplier: new Decimal(1.50),
    otMultiplier: new Decimal(1.30),
    nightDifferentialMultiplier: new Decimal(1.10),
  }
};

/**
 * Resolves the final multipliers by taking the maximum of the statutory minimum and the company policy.
 * @throws Error if company policy undercuts statutory minimum (can optionally just reject and use statutory).
 */
export function resolveDayRule(dayType: DayType, companyRuleOverrides?: any): DayRule {
  const statutory = STATUTORY_RULES[dayType];
  if (!statutory) {
    throw new Error(`Unknown day type: ${dayType}`);
  }

  // If no company overrides, return statutory
  if (!companyRuleOverrides || !companyRuleOverrides[dayType]) {
    return statutory;
  }

  const companyRules = companyRuleOverrides[dayType];

  const resolved = {
    baseMultiplier: statutory.baseMultiplier,
    otMultiplier: statutory.otMultiplier,
    nightDifferentialMultiplier: statutory.nightDifferentialMultiplier
  };

  // Compare Base
  if (companyRules.base_multiplier) {
    const compBase = new Decimal(companyRules.base_multiplier);
    if (compBase.lessThan(statutory.baseMultiplier)) {
      console.warn(`[Payroll Engine] Invalid company base multiplier (${compBase}) for ${dayType} is below statutory minimum (${statutory.baseMultiplier}). Using statutory.`);
    } else {
      resolved.baseMultiplier = compBase;
    }
  }

  // Compare OT
  if (companyRules.ot_multiplier) {
    const compOt = new Decimal(companyRules.ot_multiplier);
    if (compOt.lessThan(statutory.otMultiplier)) {
      console.warn(`[Payroll Engine] Invalid company OT multiplier (${compOt}) for ${dayType} is below statutory minimum (${statutory.otMultiplier}). Using statutory.`);
    } else {
      resolved.otMultiplier = compOt;
    }
  }

  // Compare Night Diff
  if (companyRules.night_multiplier) {
    const compNight = new Decimal(companyRules.night_multiplier);
    if (compNight.lessThan(statutory.nightDifferentialMultiplier)) {
      console.warn(`[Payroll Engine] Invalid company Night multiplier (${compNight}) for ${dayType} is below statutory minimum (${statutory.nightDifferentialMultiplier}). Using statutory.`);
    } else {
      resolved.nightDifferentialMultiplier = compNight;
    }
  }

  return resolved;
}

/**
 * Determines the day type based on a specific date, holiday configuration, and employee rest days.
 */
export function determineDayType(
  dateIso: string,
  restDays: string[],
  holidays: any[]
): DayType {
  const dateObj = new Date(dateIso);
  const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const isRestDay = restDays.includes(dayOfWeek);

  // Find if date is a holiday
  const holiday = holidays.find(h => h.date === dateIso);
  
  if (holiday) {
    if (holiday.type === 'Regular') {
      return isRestDay ? 'Regular Holiday + Rest Day' : 'Regular Holiday';
    } else if (holiday.type === 'Special Non-Working') {
      return isRestDay ? 'Special Non-Working Day + Rest Day' : 'Special Non-Working Day';
    }
  }

  return isRestDay ? 'Scheduled Rest Day' : 'Regular Workday';
}
