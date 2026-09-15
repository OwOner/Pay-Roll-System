-- Function to automatically mark payroll adjustments as processed when a run is approved
CREATE OR REPLACE FUNCTION process_payroll_adjustments_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when status changes to 'Approved'
    IF NEW.status = 'Approved' AND OLD.status != 'Approved' THEN
        
        -- Update earnings adjustments
        UPDATE public.payroll_adjustments pa
        SET status = 'Processed',
            updated_at = NOW()
        FROM public.payroll_items pi
        JOIN public.payroll_earnings pe ON pe.payroll_item_id = pi.id
        WHERE pi.payroll_run_id = NEW.id
          AND pe.source = 'payroll_adjustments'
          AND pa.id::text = pe.source_id;

        -- Update deductions adjustments
        UPDATE public.payroll_adjustments pa
        SET status = 'Processed',
            updated_at = NOW()
        FROM public.payroll_items pi
        JOIN public.payroll_deductions pd ON pd.payroll_item_id = pi.id
        WHERE pi.payroll_run_id = NEW.id
          AND pd.source = 'payroll_adjustments'
          AND pa.id::text = pd.source_id;

    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_process_adjustments_on_approval ON public.payroll_runs;
CREATE TRIGGER trigger_process_adjustments_on_approval
AFTER UPDATE ON public.payroll_runs
FOR EACH ROW
EXECUTE FUNCTION process_payroll_adjustments_on_approval();
