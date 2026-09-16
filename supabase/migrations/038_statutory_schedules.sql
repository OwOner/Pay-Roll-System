-- 038_statutory_schedules.sql

-- 1. Create company statutory schedules table
CREATE TABLE public.company_statutory_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pay_frequency TEXT NOT NULL, -- e.g. 'Semi-Monthly', 'Weekly', 'Monthly'
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create schedule allocations
CREATE TABLE public.statutory_schedule_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES public.company_statutory_schedules(id) ON DELETE CASCADE,
    period_sequence INTEGER NOT NULL, -- e.g., 1 (1st cutoff), 2 (2nd cutoff)
    contribution_type TEXT NOT NULL, -- 'SSS', 'PhilHealth', 'Pag-IBIG'
    allocation_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(schedule_id, period_sequence, contribution_type)
);

-- 3. Extend payroll_periods
ALTER TABLE public.payroll_periods
    ADD COLUMN statutory_schedule_id UUID REFERENCES public.company_statutory_schedules(id) ON DELETE RESTRICT,
    ADD COLUMN period_sequence INTEGER,
    ADD COLUMN contribution_month DATE; -- e.g. '2026-09-01' to represent September 2026

-- 4. Triggers for updated_at
CREATE TRIGGER set_company_statutory_schedules_updated_at
BEFORE UPDATE ON public.company_statutory_schedules
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_statutory_schedule_allocations_updated_at
BEFORE UPDATE ON public.statutory_schedule_allocations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
