-- 032_timesheet_ot_ut_expansion.sql

-- 1. Create a specific Timesheet Details table to track day types and daily totals
CREATE TABLE public.timesheet_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timesheet_id UUID NOT NULL REFERENCES public.timesheets(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Context
    day_type TEXT NOT NULL DEFAULT 'Regular Workday', -- e.g., 'Regular Workday', 'Scheduled Rest Day', 'Regular Holiday', 'Special Non-Working Day'
    scheduled_hours NUMERIC(8,2) NOT NULL DEFAULT 8.00,
    
    -- Attendance Facts
    regular_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    
    -- OT Workflow
    recorded_ot_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    approved_ot_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    payable_ot_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    
    -- UT Workflow
    recorded_ut_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    excused_ut_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    payable_ut_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    
    -- Validation logic (regular hours should not exceed scheduled)
    CONSTRAINT check_regular_hours CHECK (regular_hours <= scheduled_hours),
    
    -- To support overrides
    override_reason TEXT,
    override_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(timesheet_id, date)
);

CREATE TRIGGER set_timesheet_details_updated_at
BEFORE UPDATE ON public.timesheet_details
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Refactor existing timesheets aggregations
ALTER TABLE public.timesheets 
DROP COLUMN IF EXISTS calculated_total_overtime_hours,
DROP COLUMN IF EXISTS overridden_total_overtime_hours,
DROP COLUMN IF EXISTS calculated_late_undertime_hours,
DROP COLUMN IF EXISTS overridden_late_undertime_hours,
DROP COLUMN IF EXISTS total_regular_hours,
DROP COLUMN IF EXISTS total_overtime_hours,
DROP COLUMN IF EXISTS late_undertime_hours;

ALTER TABLE public.timesheets
ADD COLUMN total_regular_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00,
ADD COLUMN total_recorded_ot_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00,
ADD COLUMN total_payable_ot_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00,
ADD COLUMN total_recorded_ut_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00,
ADD COLUMN total_payable_ut_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00;
