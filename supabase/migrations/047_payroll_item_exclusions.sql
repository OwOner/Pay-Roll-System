-- 047_payroll_item_exclusions.sql

ALTER TABLE public.payroll_items
ADD COLUMN is_excluded BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN exclusion_reason TEXT,
ADD COLUMN excluded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN excluded_at TIMESTAMPTZ;
