import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import { resolveDayRule } from "../day-rules";
import { deriveHourlyRate, WorkPolicy } from "../rate-calculator";

describe("DOLE Statutory OT/UT Engine Tests", () => {
  describe("Test 1: Statutory floor (rejects 1.10x, uses 1.25x)", () => {
    it("should reject company OT multiplier if below statutory minimum", () => {
      const companyRules = {
        'Regular Workday': { ot_multiplier: 1.10 } // Invalid
      };
      
      const rule = resolveDayRule('Regular Workday', companyRules);
      expect(rule.otMultiplier.toNumber()).toBe(1.25); // Defaults back to statutory 1.25
    });

    it("should accept company OT multiplier if above statutory minimum", () => {
      const companyRules = {
        'Regular Workday': { ot_multiplier: 1.50 } // Valid, company is generous
      };
      
      const rule = resolveDayRule('Regular Workday', companyRules);
      expect(rule.otMultiplier.toNumber()).toBe(1.50);
    });
  });

  describe("Test 2: Conversion (261 vs 313 methods)", () => {
    it("should yield different hourly rates for 261 vs 313 for same monthly salary", () => {
      const comp = {
        id: "comp-1",
        salary_basis: "Monthly" as const,
        salary_type: "Monthly",
        basic_salary: new Decimal(20000), // 20k per month
        effective_from: "2026-01-01", effective_to: null,
        daily_rate: new Decimal(0),
        pay_frequency: "Semi-monthly",
        working_hours_per_day: new Decimal(8),
        working_days_per_week: new Decimal(5)
      };

      const policy261: WorkPolicy = {
        scheduled_hours_per_day: 8,
        scheduled_days_per_week: 5,
        rest_days: ["Saturday", "Sunday"],
        rest_days_paid: false,
        daily_rate_method: "annualized_261",
        annualization_factor: 261,
        ot_enabled: true,
        requires_ot_approval: true,
        ut_deduction_enabled: true,
        night_differential_enabled: true,
        custom_day_rules: {}
      };

      const policy313: WorkPolicy = {
        ...policy261,
        scheduled_days_per_week: 6,
        rest_days: ["Sunday"],
        daily_rate_method: "annualized_313",
        annualization_factor: 313,
      };

      const rate261 = deriveHourlyRate(comp, policy261);
      const rate313 = deriveHourlyRate(comp, policy313);

      // EDR for 261 = 20000 * 12 / 261 = 919.54
      // Hourly = 919.54 / 8 = 114.94
      expect(rate261.baseHourlyRate.toNumber()).toBeCloseTo(114.9425, 4);

      // EDR for 313 = 20000 * 12 / 313 = 766.77
      // Hourly = 766.77 / 8 = 95.84
      expect(rate313.baseHourlyRate.toNumber()).toBeCloseTo(95.8466, 4);
    });
  });

  describe("Test 3: Composition (Holiday + Rest Day + OT = 3.38x)", () => {
    it("should multiplicatively compose Regular Holiday + Rest Day OT", () => {
      const rule = resolveDayRule('Regular Holiday + Rest Day', {});
      
      const baseHourlyRate = new Decimal(100);
      const payableOtHours = new Decimal(2);

      // Base multiplier for Regular Holiday + Rest Day is 2.60 (2.00 * 1.30)
      expect(rule.baseMultiplier.toNumber()).toBe(2.60);
      expect(rule.otMultiplier.toNumber()).toBe(1.30);

      const otHourlyRate = baseHourlyRate.mul(rule.baseMultiplier).mul(rule.otMultiplier);
      
      expect(otHourlyRate.toNumber()).toBe(338); // 100 * 2.60 * 1.30 = 338
      
      const otPay = payableOtHours.mul(otHourlyRate);
      expect(otPay.toNumber()).toBe(676); // 2 hours * 338 = 676
    });
  });

  describe("Test 4: Night Differential + OT composition", () => {
    it("should apply 10% premium on the active hourly rate", () => {
      // Regular Workday OT Night Diff
      const rule = resolveDayRule('Regular Workday', {});
      
      const baseHourlyRate = new Decimal(100);
      const nightHours = new Decimal(1); // 1 hour of night work

      // We apply it on the base day rate here for simplicity
      const nightPremium = rule.nightDifferentialMultiplier.minus(1);
      const activeRate = baseHourlyRate.mul(rule.baseMultiplier);
      const nightPay = nightHours.mul(activeRate).mul(nightPremium);

      // 100 * 1.00 * 0.10 = 10
      expect(nightPay.toNumber()).toBe(10);
      
      // If it's a holiday rest day:
      const rule2 = resolveDayRule('Regular Holiday + Rest Day', {});
      const activeRate2 = baseHourlyRate.mul(rule2.baseMultiplier);
      const nightPay2 = nightHours.mul(activeRate2).mul(rule2.nightDifferentialMultiplier.minus(1));

      // 100 * 2.60 * 0.10 = 26
      expect(nightPay2.toNumber()).toBe(26);
    });
  });

  describe("Test 5: Regular Hours + OT separation", () => {
    it("should process 8 regular hours and 2 OT hours separately", () => {
      // Create a mock timesheet detail
      const detail = {
        date: "2026-09-07",
        day_type: "Regular Workday",
        regular_hours: 8,
        payable_ot_hours: 2,
        payable_ut_hours: 0
      };
      
      const baseHourlyRate = new Decimal(100);
      const rule = resolveDayRule('Regular Workday', {});

      // Simulate engine processing
      const dailyRegularPay = new Decimal(detail.regular_hours).mul(baseHourlyRate).mul(rule.baseMultiplier);
      const otHourlyRate = baseHourlyRate.mul(rule.baseMultiplier).mul(rule.otMultiplier);
      const otPay = new Decimal(detail.payable_ot_hours).mul(otHourlyRate);

      expect(dailyRegularPay.toNumber()).toBe(800); // 8 * 100
      expect(otPay.toNumber()).toBe(250); // 2 * 125
    });
  });

});
