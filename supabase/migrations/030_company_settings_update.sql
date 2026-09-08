-- 030_company_settings_update.sql

-- Add government registration numbers to company_settings

ALTER TABLE public.company_settings ADD COLUMN sss_number TEXT;
ALTER TABLE public.company_settings ADD COLUMN philhealth_number TEXT;
ALTER TABLE public.company_settings ADD COLUMN pagibig_number TEXT;

-- Enforce singleton pattern via trigger if not already done
CREATE OR REPLACE FUNCTION public.enforce_single_company_settings_row()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT count(*) FROM public.company_settings) > 0 THEN
        RAISE EXCEPTION 'Only one row is allowed in company_settings.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_single_company_settings_row ON public.company_settings;

CREATE TRIGGER enforce_single_company_settings_row
BEFORE INSERT ON public.company_settings
FOR EACH ROW EXECUTE FUNCTION public.enforce_single_company_settings_row();

-- Ensure there is exactly one row
INSERT INTO public.company_settings (company_name, address)
SELECT 'Nexus Payroll', 'Metro Manila, Philippines'
WHERE NOT EXISTS (SELECT 1 FROM public.company_settings);
