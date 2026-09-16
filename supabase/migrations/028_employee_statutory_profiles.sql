-- 028_employee_statutory_profiles.sql

CREATE TABLE public.employee_statutory_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    sss_applicable BOOLEAN NOT NULL DEFAULT true,
    philhealth_applicable BOOLEAN NOT NULL DEFAULT true,
    pagibig_applicable BOOLEAN NOT NULL DEFAULT true,
    effective_from DATE NOT NULL,
    effective_to DATE,
    reason TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (effective_to IS NULL OR effective_from <= effective_to)
);

-- Constraint to prevent overlapping active profiles
-- Requires btree_gist extension (already created in 014_payroll_locking or earlier, but we can ensure it)
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.employee_statutory_profiles
ADD CONSTRAINT no_overlapping_profiles EXCLUDE USING gist (
    employee_id WITH =,
    daterange(effective_from, COALESCE(effective_to, 'infinity'), '[]') WITH &&
);

-- Trigger to handle updated_at
CREATE TRIGGER set_employee_statutory_profiles_updated_at
BEFORE UPDATE ON public.employee_statutory_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies
ALTER TABLE public.employee_statutory_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users"
ON public.employee_statutory_profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert access to authenticated users"
ON public.employee_statutory_profiles FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update access to authenticated users"
ON public.employee_statutory_profiles FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete access to authenticated users"
ON public.employee_statutory_profiles FOR DELETE
TO authenticated
USING (true);

-- Data Migration: Seed existing employees
INSERT INTO public.employee_statutory_profiles (
    employee_id,
    sss_applicable,
    philhealth_applicable,
    pagibig_applicable,
    effective_from,
    reason
)
SELECT 
    id,
    true,
    true,
    true,
    date_hired,
    'Initial profile derived from hire date'
FROM public.employees;
