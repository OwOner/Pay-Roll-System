-- 042_payroll_period_statutory_status.sql

ALTER TABLE public.payroll_periods 
    ADD COLUMN statutory_configuration_status TEXT NOT NULL DEFAULT 'Pending' 
    CHECK (statutory_configuration_status IN ('Pending', 'Configured', 'Not Required', 'Intentionally Skipped'));

-- Update the immutability trigger (040_statutory_schedules_protection) to also watch this new column
CREATE OR REPLACE FUNCTION public.check_payroll_period_configuration_immutability()
RETURNS TRIGGER AS $$
DECLARE
    run_status TEXT;
BEGIN
    IF NEW.statutory_schedule_id IS DISTINCT FROM OLD.statutory_schedule_id OR
       NEW.period_sequence IS DISTINCT FROM OLD.period_sequence OR
       NEW.contribution_month IS DISTINCT FROM OLD.contribution_month OR
       NEW.statutory_configuration_status IS DISTINCT FROM OLD.statutory_configuration_status THEN
        
        -- Get the status of the associated payroll run, if any
        SELECT status INTO run_status FROM public.payroll_runs WHERE payroll_period_id = OLD.id;
        
        -- If it exists and is not Draft, block the change.
        IF run_status IS NOT NULL AND run_status != 'Draft' THEN
            RAISE EXCEPTION 'Payroll Period configuration can only be changed while the payroll period is Draft and has no finalized payroll run.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
