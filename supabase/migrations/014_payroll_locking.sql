-- 014_payroll_locking.sql

-- This trigger function prevents any modification to payroll_runs, payroll_items, 
-- payroll_earnings, or payroll_deductions if the associated run is 'Approved' or 'Paid'.

CREATE OR REPLACE FUNCTION public.check_payroll_locked()
RETURNS TRIGGER AS $$
DECLARE
    run_status TEXT;
BEGIN
    -- Determine the status of the associated payroll run
    IF TG_TABLE_NAME = 'payroll_runs' THEN
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

-- Apply to Runs
CREATE TRIGGER prevent_locked_payroll_runs_update
BEFORE UPDATE OR DELETE ON public.payroll_runs
FOR EACH ROW EXECUTE FUNCTION public.check_payroll_locked();

-- Apply to Items
CREATE TRIGGER prevent_locked_payroll_items_update
BEFORE UPDATE OR DELETE ON public.payroll_items
FOR EACH ROW EXECUTE FUNCTION public.check_payroll_locked();

-- Apply to Earnings
CREATE TRIGGER prevent_locked_payroll_earnings_update
BEFORE UPDATE OR DELETE ON public.payroll_earnings
FOR EACH ROW EXECUTE FUNCTION public.check_payroll_locked();

-- Apply to Deductions
CREATE TRIGGER prevent_locked_payroll_deductions_update
BEFORE UPDATE OR DELETE ON public.payroll_deductions
FOR EACH ROW EXECUTE FUNCTION public.check_payroll_locked();
