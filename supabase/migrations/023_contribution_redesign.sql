-- 023_contribution_redesign.sql
-- Redesigns the government contribution system to support agency-specific
-- calculation structures, proper audit metadata, and immutability controls.

-- ============================================================
-- 1. Extend government_contribution_tables
-- ============================================================
ALTER TABLE public.government_contribution_tables
  ADD COLUMN IF NOT EXISTS table_type TEXT NOT NULL DEFAULT 'government'
    CONSTRAINT gov_table_type_check CHECK (table_type IN ('government', 'custom')),
  ADD COLUMN IF NOT EXISTS source_agency TEXT,
  ADD COLUMN IF NOT EXISTS issuance_reference TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS statutory_effective_from DATE,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Draft'
    CONSTRAINT gov_table_status_check CHECK (status IN ('Draft', 'Published', 'Superseded'));

-- ============================================================
-- 2. Extend government_contribution_brackets with SSS MSC columns
-- ============================================================
ALTER TABLE public.government_contribution_brackets
  ADD COLUMN IF NOT EXISTS monthly_salary_credit  NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS regular_ss_employee    NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS regular_ss_employer    NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mpf_employee           NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mpf_employer           NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ec_employer            NUMERIC(12,2) DEFAULT 0;

-- ============================================================
-- 3. Create philhealth_configs (dedicated PhilHealth config)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.philhealth_configs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,
  table_type              TEXT NOT NULL DEFAULT 'government'
                            CONSTRAINT ph_table_type_check CHECK (table_type IN ('government', 'custom')),
  status                  TEXT NOT NULL DEFAULT 'Draft'
                            CONSTRAINT ph_status_check CHECK (status IN ('Draft', 'Published', 'Superseded')),
  source_agency           TEXT DEFAULT 'PhilHealth',
  issuance_reference      TEXT,
  source_url              TEXT,
  statutory_effective_from DATE NOT NULL,
  effective_from          DATE NOT NULL,
  effective_to            DATE,
  is_active               BOOLEAN NOT NULL DEFAULT false,
  premium_rate            NUMERIC(8,6) NOT NULL,   -- e.g. 0.050000 for 5%
  floor_mbs               NUMERIC(12,2) NOT NULL,  -- e.g. 10000.00
  ceiling_mbs             NUMERIC(12,2) NOT NULL,  -- e.g. 100000.00
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by              UUID REFERENCES public.profiles(id),
  CONSTRAINT ph_date_range CHECK (effective_to IS NULL OR effective_from <= effective_to)
);

-- ============================================================
-- 4. Create pagibig_configs (dedicated Pag-IBIG/HDMF config)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pagibig_configs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,
  table_type              TEXT NOT NULL DEFAULT 'government'
                            CONSTRAINT pagibig_table_type_check CHECK (table_type IN ('government', 'custom')),
  status                  TEXT NOT NULL DEFAULT 'Draft'
                            CONSTRAINT pagibig_status_check CHECK (status IN ('Draft', 'Published', 'Superseded')),
  source_agency           TEXT DEFAULT 'HDMF',
  issuance_reference      TEXT,
  source_url              TEXT,
  statutory_effective_from DATE NOT NULL,
  effective_from          DATE NOT NULL,
  effective_to            DATE,
  is_active               BOOLEAN NOT NULL DEFAULT false,
  employee_rate_low       NUMERIC(8,6) NOT NULL,   -- rate for MFS <= threshold (e.g. 0.010000)
  employee_rate_high      NUMERIC(8,6) NOT NULL,   -- rate for MFS > threshold (e.g. 0.020000)
  salary_threshold        NUMERIC(12,2) NOT NULL,  -- the split threshold (e.g. 1500.00)
  employer_rate           NUMERIC(8,6) NOT NULL,   -- e.g. 0.020000
  max_compensation        NUMERIC(12,2) NOT NULL,  -- MFS ceiling (e.g. 10000.00)
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by              UUID REFERENCES public.profiles(id),
  CONSTRAINT pagibig_date_range CHECK (effective_to IS NULL OR effective_from <= effective_to)
);

-- ============================================================
-- 5. Triggers for updated_at
-- ============================================================
CREATE TRIGGER set_philhealth_configs_updated_at
BEFORE UPDATE ON public.philhealth_configs
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_pagibig_configs_updated_at
BEFORE UPDATE ON public.pagibig_configs
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 6. Mark old placeholder SSS data as Superseded (will be replaced by seed)
-- ============================================================
UPDATE public.government_contribution_tables
SET status = 'Superseded', is_active = false
WHERE contribution_type = 'SSS';

-- Mark old placeholder PhilHealth/Pag-IBIG entries as Superseded
UPDATE public.government_contribution_tables
SET status = 'Superseded', is_active = false
WHERE contribution_type IN ('PhilHealth', 'Pag-IBIG');
