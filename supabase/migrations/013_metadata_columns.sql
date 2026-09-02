-- 013_metadata_columns.sql

ALTER TABLE public.tax_tables
ADD COLUMN agency TEXT,
ADD COLUMN reference_number TEXT,
ADD COLUMN source_url TEXT,
ADD COLUMN notes TEXT,
ADD COLUMN version TEXT;

ALTER TABLE public.government_contribution_tables
ADD COLUMN agency TEXT,
ADD COLUMN reference_number TEXT,
ADD COLUMN source_url TEXT,
ADD COLUMN notes TEXT,
ADD COLUMN version TEXT;
