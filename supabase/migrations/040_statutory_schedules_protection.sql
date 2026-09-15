-- 040_statutory_schedules_protection.sql

-- 1. Update company_statutory_schedules schema
ALTER TABLE public.company_statutory_schedules 
    ADD COLUMN name TEXT NOT NULL DEFAULT 'Unnamed Schedule',
    ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Update payroll_periods schema
ALTER TABLE public.payroll_periods 
    ADD CONSTRAINT enforce_contribution_month_trunc 
    CHECK (contribution_month IS NULL OR contribution_month = date_trunc('month', contribution_month)::date);

-- 3. Immutability trigger for company_statutory_schedules
CREATE OR REPLACE FUNCTION public.check_schedule_immutability()
RETURNS TRIGGER AS $$
DECLARE
    finalized_run_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.payroll_periods pp
        JOIN public.payroll_runs pr ON pp.id = pr.payroll_period_id
        WHERE pp.statutory_schedule_id = OLD.id
        AND pr.status IN ('Calculated', 'For Review', 'Pending Approval', 'Approved', 'Paid')
    ) INTO finalized_run_exists;
    
    IF finalized_run_exists THEN
        IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION 'Cannot delete a statutory schedule that is associated with a calculated or finalized payroll.';
        END IF;
        
        -- Allow changing effective_to and is_active only
        IF NEW.pay_frequency IS DISTINCT FROM OLD.pay_frequency OR
           NEW.name IS DISTINCT FROM OLD.name OR
           NEW.description IS DISTINCT FROM OLD.description OR
           NEW.effective_from IS DISTINCT FROM OLD.effective_from THEN
            RAISE EXCEPTION 'Cannot modify core fields of a statutory schedule associated with calculated/finalized payroll. (Only effective_to and is_active can be updated).';
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_schedule_immutability
BEFORE UPDATE OR DELETE ON public.company_statutory_schedules
FOR EACH ROW EXECUTE FUNCTION public.check_schedule_immutability();

-- 4. Immutability trigger for statutory_schedule_allocations
CREATE OR REPLACE FUNCTION public.check_schedule_allocation_immutability()
RETURNS TRIGGER AS $$
DECLARE
    finalized_run_exists BOOLEAN;
    sched_id UUID;
BEGIN
    sched_id := COALESCE(OLD.schedule_id, NEW.schedule_id);

    SELECT EXISTS (
        SELECT 1 FROM public.payroll_periods pp
        JOIN public.payroll_runs pr ON pp.id = pr.payroll_period_id
        WHERE pp.statutory_schedule_id = sched_id
        AND pr.status IN ('Calculated', 'For Review', 'Pending Approval', 'Approved', 'Paid')
    ) INTO finalized_run_exists;
    
    IF finalized_run_exists THEN
        RAISE EXCEPTION 'Cannot modify allocations for a statutory schedule that is associated with a calculated or finalized payroll.';
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_allocation_immutability
BEFORE INSERT OR UPDATE OR DELETE ON public.statutory_schedule_allocations
FOR EACH ROW EXECUTE FUNCTION public.check_schedule_allocation_immutability();

-- 5. Overlap trigger for active company_statutory_schedules
CREATE OR REPLACE FUNCTION public.check_schedule_overlap()
RETURNS TRIGGER AS $$
DECLARE
    overlap_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.company_statutory_schedules
        WHERE id != NEW.id
        AND pay_frequency = NEW.pay_frequency
        AND is_active = true
        AND NEW.is_active = true
        AND (
            (NEW.effective_to IS NULL AND effective_to IS NULL) OR
            (NEW.effective_to IS NULL AND NEW.effective_from <= effective_to) OR
            (effective_to IS NULL AND effective_from <= NEW.effective_to) OR
            (NEW.effective_from <= effective_to AND effective_from <= NEW.effective_to)
        )
    ) INTO overlap_exists;

    IF overlap_exists THEN
        RAISE EXCEPTION 'Overlapping active statutory schedules found for frequency %.', NEW.pay_frequency;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_schedule_overlap
BEFORE INSERT OR UPDATE ON public.company_statutory_schedules
FOR EACH ROW EXECUTE FUNCTION public.check_schedule_overlap();

-- 6. Immutability trigger for payroll_periods configuration
CREATE OR REPLACE FUNCTION public.check_payroll_period_configuration_immutability()
RETURNS TRIGGER AS $$
DECLARE
    run_status TEXT;
BEGIN
    IF NEW.statutory_schedule_id IS DISTINCT FROM OLD.statutory_schedule_id OR
       NEW.period_sequence IS DISTINCT FROM OLD.period_sequence OR
       NEW.contribution_month IS DISTINCT FROM OLD.contribution_month THEN
        
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

CREATE TRIGGER enforce_period_config_immutability
BEFORE UPDATE ON public.payroll_periods
FOR EACH ROW EXECUTE FUNCTION public.check_payroll_period_configuration_immutability();
