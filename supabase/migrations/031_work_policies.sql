-- 031_work_policies.sql

-- Daily Rate Method Enum
CREATE TYPE daily_rate_method AS ENUM (
    'annualized_313', 
    'annualized_261', 
    'annualized_393_5', 
    'actual_days_worked', 
    'weekly_preserved',
    'daily_preserved'
);

-- Work Policies
CREATE TABLE public.work_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    
    -- Scheduling
    scheduled_hours_per_day NUMERIC(8,2) NOT NULL DEFAULT 8.00,
    scheduled_days_per_week NUMERIC(8,2) NOT NULL DEFAULT 5.00,
    rest_days JSONB NOT NULL DEFAULT '["Saturday", "Sunday"]', -- Array of day names
    rest_days_paid BOOLEAN NOT NULL DEFAULT false,
    
    -- Annualization and Hourly Equivalent Math
    daily_rate_method daily_rate_method NOT NULL DEFAULT 'annualized_261',
    annualization_factor NUMERIC(8,2), -- e.g., 261, 313, 393.5 (Can be null if daily_preserved)
    
    -- OT/UT Control Toggles
    ot_enabled BOOLEAN NOT NULL DEFAULT true,
    requires_ot_approval BOOLEAN NOT NULL DEFAULT true,
    ut_deduction_enabled BOOLEAN NOT NULL DEFAULT true,
    night_differential_enabled BOOLEAN NOT NULL DEFAULT true,

    -- Company Custom Multipliers (Must not undercut DOLE Statutory Minimums when resolved)
    custom_day_rules JSONB DEFAULT '{}'::jsonb,

    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employee Work Policies (Effective-dated overrides)
CREATE TABLE public.employee_work_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    work_policy_id UUID NOT NULL REFERENCES public.work_policies(id) ON DELETE RESTRICT,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_policy_date_range CHECK (effective_to IS NULL OR effective_from <= effective_to)
);

-- Add default_work_policy_id to Positions
ALTER TABLE public.positions
ADD COLUMN default_work_policy_id UUID REFERENCES public.work_policies(id) ON DELETE SET NULL;

-- Triggers for updated_at
CREATE TRIGGER set_work_policies_updated_at
BEFORE UPDATE ON public.work_policies
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_employee_work_policies_updated_at
BEFORE UPDATE ON public.employee_work_policies
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
