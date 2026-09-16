-- 007_tax_configuration.sql

-- Philippine Tax Tables (Versioned / Effective-Dated)
CREATE TABLE public.tax_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- e.g., 'TRAIN Law 2023', 'CREATE Law 2026'
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (effective_to IS NULL OR effective_from <= effective_to)
);

-- Tax Brackets
CREATE TABLE public.tax_brackets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_table_id UUID NOT NULL REFERENCES public.tax_tables(id) ON DELETE CASCADE,
    pay_frequency TEXT NOT NULL, -- 'Daily', 'Weekly', 'Semi-monthly', 'Monthly', 'Annual'
    tax_status TEXT NOT NULL DEFAULT 'Single/Married', -- 'Single/Married', 'Head of Family' (if needed)
    
    minimum_income NUMERIC(12,2) NOT NULL,
    maximum_income NUMERIC(12,2),
    base_tax NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    excess_rate NUMERIC(8,4) NOT NULL DEFAULT 0.0000, -- e.g., 0.2000 for 20%
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers
CREATE TRIGGER set_tax_tables_updated_at
BEFORE UPDATE ON public.tax_tables
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_tax_brackets_updated_at
BEFORE UPDATE ON public.tax_brackets
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
