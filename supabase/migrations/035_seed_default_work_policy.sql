-- Add is_company_default to work_policies
ALTER TABLE "public"."work_policies" ADD COLUMN IF NOT EXISTS "is_company_default" BOOLEAN NOT NULL DEFAULT false;

-- Insert a default Work Policy if the table is empty
INSERT INTO "public"."work_policies" (
  id,
  name,
  is_company_default,
  scheduled_hours_per_day,
  scheduled_days_per_week,
  rest_days,
  rest_days_paid,
  daily_rate_method,
  annualization_factor,
  ot_enabled,
  requires_ot_approval,
  ut_deduction_enabled,
  night_differential_enabled,
  custom_day_rules,
  is_active
)
SELECT 
  gen_random_uuid(),
  'Standard Corporate Policy',
  true,
  8,
  5,
  '["Saturday", "Sunday"]'::jsonb,
  false,
  'annualized_261',
  261,
  true,
  true,
  true,
  true,
  '{}'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM "public"."work_policies" WHERE is_company_default = true
);
