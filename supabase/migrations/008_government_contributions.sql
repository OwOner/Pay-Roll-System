-- 008_government_contributions.sql

-- Government Contribution Tables (Versioned)
CREATE TABLE public.government_contribution_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contribution_type TEXT NOT NULL, -- 'SSS', 'PhilHealth', 'Pag-IBIG'
    name TEXT NOT NULL, -- e.g., 'SSS 2026 Table', 'PhilHealth 5% 2026'
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (effective_to IS NULL OR effective_from <= effective_to)
);

-- Government Contribution Brackets
CREATE TABLE public.government_contribution_brackets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contribution_table_id UUID NOT NULL REFERENCES public.government_contribution_tables(id) ON DELETE CASCADE,
    
    salary_min NUMERIC(12,2) NOT NULL,
    salary_max NUMERIC(12,2),
    
    -- Can either be fixed amounts or rates
    employee_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    employer_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    
    employee_rate NUMERIC(8,4) NOT NULL DEFAULT 0.0000, -- e.g., 0.0500 for 5%
    employer_rate NUMERIC(8,4) NOT NULL DEFAULT 0.0000,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers
CREATE TRIGGER set_government_contribution_tables_updated_at
BEFORE UPDATE ON public.government_contribution_tables
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_government_contribution_brackets_updated_at
BEFORE UPDATE ON public.government_contribution_brackets
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
