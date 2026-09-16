-- 048_timesheet_present_days.sql

ALTER TABLE public.timesheets
ADD COLUMN calculated_present_days NUMERIC(8,2) NOT NULL DEFAULT 0.00,
ADD COLUMN overridden_present_days NUMERIC(8,2);
