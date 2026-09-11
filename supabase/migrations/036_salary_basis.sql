-- Migration 036: Add salary_basis as canonical compensation field
-- Separates "how the rate is calculated" (salary_basis) from "how often they're paid" (pay_frequency)
-- salary_type is kept for backward compatibility but salary_basis is now the authoritative field.

-- 1. Add the new columns
ALTER TABLE public.employee_compensation_history
  ADD COLUMN IF NOT EXISTS salary_basis TEXT,
  ADD COLUMN IF NOT EXISTS weekly_rate NUMERIC(12, 2);

-- 2. Backfill from salary_type — only map KNOWN values.
--    Unknown/unexpected values are left NULL so staff can review them manually.
UPDATE public.employee_compensation_history
SET salary_basis = CASE
  -- Explicitly monthly-basis pay frequencies
  WHEN LOWER(salary_type) IN ('monthly', 'semi-monthly', 'semi_monthly', 'bi-weekly', 'bi_weekly', 'biweekly') THEN 'Monthly'
  -- Daily basis
  WHEN LOWER(salary_type) = 'daily'   THEN 'Daily'
  -- Weekly basis
  WHEN LOWER(salary_type) = 'weekly'  THEN 'Weekly'
  -- Hourly basis
  WHEN LOWER(salary_type) = 'hourly'  THEN 'Hourly'
  -- Everything else: leave NULL so it surfaces as a visible data problem, not a silent wrong assumption
  ELSE NULL
END
WHERE salary_basis IS NULL;

-- 3. Add a check constraint for valid values (allows NULL so unknown legacy rows surface clearly)
ALTER TABLE public.employee_compensation_history
  DROP CONSTRAINT IF EXISTS chk_salary_basis;

ALTER TABLE public.employee_compensation_history
  ADD CONSTRAINT chk_salary_basis
  CHECK (salary_basis IS NULL OR salary_basis IN ('Monthly', 'Daily', 'Weekly', 'Hourly'));

-- 4. Add a comment marking salary_type as deprecated
COMMENT ON COLUMN public.employee_compensation_history.salary_type
  IS '[DEPRECATED] Use salary_basis instead. Kept for backward compatibility only.';

COMMENT ON COLUMN public.employee_compensation_history.salary_basis
  IS 'The basis for the employee''s pay rate: Monthly, Daily, Weekly, or Hourly. '
     'This determines which rate column the payroll engine uses. '
     'Rows where this is NULL have unresolved legacy data and must be corrected before payroll can run.';

COMMENT ON COLUMN public.employee_compensation_history.weekly_rate
  IS 'The weekly pay rate in PHP. Only populated when salary_basis = ''Weekly''.';
