-- 026_timesheet_architecture.sql

-- 1. Add work_schedule to employees
ALTER TABLE public.employees
ADD COLUMN work_schedule JSONB DEFAULT '{"days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}';

-- 2. Alter timesheets table
-- Drop old unique constraint
ALTER TABLE public.timesheets DROP CONSTRAINT IF EXISTS timesheets_employee_id_period_start_period_end_key;

-- Add payroll_period_id
ALTER TABLE public.timesheets 
ADD COLUMN payroll_period_id UUID REFERENCES public.payroll_periods(id) ON DELETE RESTRICT;

-- Add tracking for Staleness and Exceptions
ALTER TABLE public.timesheets
ADD COLUMN is_stale BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN missing_records_count NUMERIC(8,2) NOT NULL DEFAULT 0.00,
ADD COLUMN generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add calculation vs override columns
ALTER TABLE public.timesheets
ADD COLUMN calculated_absent_days NUMERIC(8,2),
ADD COLUMN overridden_absent_days NUMERIC(8,2),
ADD COLUMN calculated_total_regular_hours NUMERIC(8,2),
ADD COLUMN overridden_total_regular_hours NUMERIC(8,2),
ADD COLUMN calculated_total_overtime_hours NUMERIC(8,2),
ADD COLUMN overridden_total_overtime_hours NUMERIC(8,2),
ADD COLUMN calculated_late_undertime_hours NUMERIC(8,2),
ADD COLUMN overridden_late_undertime_hours NUMERIC(8,2),
ADD COLUMN override_reason TEXT,
ADD COLUMN override_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN override_at TIMESTAMPTZ;

-- Backfill payroll_period_id logic or allow null initially, then enforce? 
-- We will just clear timesheets since we have no real data yet, to safely add the UNIQUE constraint
TRUNCATE TABLE public.timesheets CASCADE;

ALTER TABLE public.timesheets ALTER COLUMN payroll_period_id SET NOT NULL;
ALTER TABLE public.timesheets ADD CONSTRAINT timesheets_emp_period_unique UNIQUE(employee_id, payroll_period_id);

-- 3. Timesheet Status History
CREATE TABLE public.timesheet_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timesheet_id UUID NOT NULL REFERENCES public.timesheets(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Immutability Trigger for Approved Timesheets
CREATE OR REPLACE FUNCTION public.check_timesheet_immutability()
RETURNS TRIGGER AS $$
BEGIN
    -- If deleting an Approved timesheet
    IF TG_OP = 'DELETE' THEN
        IF OLD.status = 'Approved' THEN
            RAISE EXCEPTION 'Cannot delete an Approved timesheet.';
        END IF;
        RETURN OLD;
    END IF;

    -- If updating an Approved timesheet
    IF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'Approved' THEN
            -- Only allow transition to 'Reopened'
            IF NEW.status = 'Reopened' THEN
                RETURN NEW;
            ELSE
                RAISE EXCEPTION 'Cannot update an Approved timesheet. Must be Reopened first.';
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_timesheet_immutability
BEFORE UPDATE OR DELETE ON public.timesheets
FOR EACH ROW
EXECUTE FUNCTION public.check_timesheet_immutability();

-- 5. Staleness Trigger on Attendance Modification
CREATE OR REPLACE FUNCTION public.mark_timesheet_stale()
RETURNS TRIGGER AS $$
DECLARE
    emp_id UUID;
    rec_date DATE;
BEGIN
    IF TG_OP = 'DELETE' THEN
        emp_id := OLD.employee_id;
        rec_date := OLD.work_date;
    ELSE
        emp_id := NEW.employee_id;
        rec_date := NEW.work_date;
    END IF;

    -- Update any timesheet that overlaps this date for this employee
    UPDATE public.timesheets
    SET is_stale = true, updated_at = NOW()
    WHERE employee_id = emp_id
      AND period_start <= rec_date
      AND period_end >= rec_date
      AND is_stale = false;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mark_timesheet_stale
AFTER INSERT OR UPDATE OR DELETE ON public.attendance_records
FOR EACH ROW
EXECUTE FUNCTION public.mark_timesheet_stale();
