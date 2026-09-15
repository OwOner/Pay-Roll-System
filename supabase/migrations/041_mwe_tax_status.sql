-- Migration: 041_mwe_tax_status
-- Description: Add tax_applicable and is_mwe to employee_statutory_profiles

ALTER TABLE public.employee_statutory_profiles 
ADD COLUMN tax_applicable BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.employee_statutory_profiles 
ADD COLUMN is_mwe BOOLEAN NOT NULL DEFAULT false;

-- Add comment for future wage automation
COMMENT ON COLUMN public.employee_statutory_profiles.is_mwe IS 'Manual flag for Minimum Wage Earner status until automated via Wage Orders';
