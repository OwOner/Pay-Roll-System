-- 049_deprecate_unused_tables.sql

-- Rename unused tables instead of dropping them, to preserve an easy rollback path.
-- These tables were verified to contain 0 rows and are completely unreferenced.

ALTER TABLE IF EXISTS public.projects RENAME TO _deprecated_projects;
ALTER TABLE IF EXISTS public.employee_deductions RENAME TO _deprecated_employee_deductions;
