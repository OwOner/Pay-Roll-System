-- Add is_payroll_exempt to employees
ALTER TABLE "public"."employees" ADD COLUMN IF NOT EXISTS "is_payroll_exempt" BOOLEAN DEFAULT false;
