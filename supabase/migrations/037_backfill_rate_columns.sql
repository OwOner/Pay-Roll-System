-- Migration 037: Backfill rate columns from existing data
-- The 036 migration added salary_basis and weekly_rate but could not populate weekly_rate
-- because old records stored all rates in basic_salary regardless of basis.
-- This migration copies the correct value into the authoritative rate column.

-- Weekly-basis employees: their basic_salary held the weekly rate
UPDATE public.employee_compensation_history
SET weekly_rate = basic_salary
WHERE salary_basis = 'Weekly'
  AND weekly_rate IS NULL
  AND basic_salary IS NOT NULL;

-- Hourly-basis employees: their basic_salary held the hourly rate
-- (only backfill if hourly_rate not already set)
UPDATE public.employee_compensation_history
SET hourly_rate = basic_salary
WHERE salary_basis = 'Hourly'
  AND hourly_rate IS NULL
  AND basic_salary IS NOT NULL;

-- Daily-basis employees: their daily_rate column should already be set
-- (it was populated by the old addCompensationHistory action)
-- but as a safety net, backfill from basic_salary if daily_rate is 0 or null
UPDATE public.employee_compensation_history
SET daily_rate = basic_salary
WHERE salary_basis = 'Daily'
  AND (daily_rate IS NULL OR daily_rate = 0)
  AND basic_salary IS NOT NULL
  AND basic_salary > 0;

-- Monthly-basis employees: basic_salary is already the monthly amount — no change needed.
-- The engine derives daily/hourly from basic_salary using the work policy's annualization_factor.
