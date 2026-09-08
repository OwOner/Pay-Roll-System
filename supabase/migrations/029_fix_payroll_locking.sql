-- 029_fix_payroll_locking.sql

-- Fixes a bug where deleting a payroll_run would silently fail because the trigger returned NEW (which is NULL for DELETE) instead of OLD.

CREATE OR REPLACE FUNCTION public.check_payroll_locked()
RETURNS TRIGGER AS $$
DECLARE
    run_status TEXT;
BEGIN
    -- Determine the status of the associated payroll run
    IF TG_TABLE_NAME = 'payroll_runs' THEN
        IF TG_OP = 'DELETE' THEN
            IF OLD.status IN ('Approved', 'Paid') THEN
                RAISE EXCEPTION 'Cannot delete a locked payroll run (Status: %).', OLD.status;
            END IF;
            RETURN OLD;
        END IF;

        -- If updating a run that is ALREADY Approved or Paid, reject.
        -- Exception: We allow status change from Approved to Paid.
        IF OLD.status IN ('Approved', 'Paid') AND NEW.status NOT IN ('Paid') THEN
            RAISE EXCEPTION 'Cannot modify a locked payroll run (Status: %).', OLD.status;
        END IF;
        RETURN NEW;
    ELSIF TG_TABLE_NAME = 'payroll_items' THEN
        SELECT status INTO run_status FROM public.payroll_runs WHERE id = OLD.payroll_run_id;
    ELSIF TG_TABLE_NAME IN ('payroll_earnings', 'payroll_deductions') THEN
        SELECT pr.status INTO run_status 
        FROM public.payroll_runs pr
        JOIN public.payroll_items pi ON pi.payroll_run_id = pr.id
        WHERE pi.id = OLD.payroll_item_id;
    END IF;

    IF run_status IN ('Approved', 'Paid') THEN
        RAISE EXCEPTION 'Cannot modify records for a locked payroll run (Status: %).', run_status;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
