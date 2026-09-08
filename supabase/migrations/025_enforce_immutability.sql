-- 025_enforce_immutability.sql
-- Enforces database-level immutability for published and superseded government configurations.

CREATE OR REPLACE FUNCTION public.check_config_immutability()
RETURNS trigger AS $$
BEGIN
  -- If the old status was 'Published' or 'Superseded', prevent updates or deletes
  -- Exception: We allow updating status from 'Published' to 'Superseded' when a new config is created.
  -- But we prevent changing any other fields (like rates, brackets, effective dates).
  
  IF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('Published', 'Superseded') THEN
      RAISE EXCEPTION 'Cannot delete a % configuration. Historical payrolls may depend on it.', OLD.status;
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'Superseded' THEN
      RAISE EXCEPTION 'Cannot modify a Superseded configuration.';
    END IF;
    
    IF OLD.status = 'Published' THEN
      -- The only allowed change to a Published config is changing its status to Superseded and is_active to false
      IF NEW.status = 'Superseded' AND NEW.is_active = false THEN
        -- Allow it, but ensure no other fields were modified
        IF 
           NEW.name != OLD.name OR
           NEW.table_type != OLD.table_type OR
           NEW.source_agency IS DISTINCT FROM OLD.source_agency OR
           NEW.issuance_reference IS DISTINCT FROM OLD.issuance_reference OR
           NEW.source_url IS DISTINCT FROM OLD.source_url OR
           NEW.statutory_effective_from != OLD.statutory_effective_from OR
           NEW.effective_from != OLD.effective_from OR
           NEW.effective_to IS DISTINCT FROM OLD.effective_to
           -- note: updated_at is allowed to change when superseding
        THEN
          RAISE EXCEPTION 'Cannot modify fields of a Published configuration other than marking it Superseded.';
        END IF;
        
        -- Also check specific config fields based on table
        IF TG_TABLE_NAME = 'philhealth_configs' THEN
          IF NEW.premium_rate != OLD.premium_rate OR NEW.floor_mbs != OLD.floor_mbs OR NEW.ceiling_mbs != OLD.ceiling_mbs THEN
             RAISE EXCEPTION 'Cannot modify PhilHealth rates on a Published configuration.';
          END IF;
        ELSIF TG_TABLE_NAME = 'pagibig_configs' THEN
          IF NEW.employee_rate_low != OLD.employee_rate_low OR NEW.employee_rate_high != OLD.employee_rate_high OR NEW.salary_threshold != OLD.salary_threshold OR NEW.employer_rate != OLD.employer_rate OR NEW.max_compensation != OLD.max_compensation THEN
             RAISE EXCEPTION 'Cannot modify Pag-IBIG rates on a Published configuration.';
          END IF;
        END IF;
        
      ELSE
        -- If they are trying to update a Published config but NOT setting it to Superseded
        RAISE EXCEPTION 'Cannot modify a Published configuration. You must create a new superseding version.';
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER enforce_sss_immutability
  BEFORE UPDATE OR DELETE ON public.government_contribution_tables
  FOR EACH ROW EXECUTE FUNCTION public.check_config_immutability();

CREATE TRIGGER enforce_philhealth_immutability
  BEFORE UPDATE OR DELETE ON public.philhealth_configs
  FOR EACH ROW EXECUTE FUNCTION public.check_config_immutability();

CREATE TRIGGER enforce_pagibig_immutability
  BEFORE UPDATE OR DELETE ON public.pagibig_configs
  FOR EACH ROW EXECUTE FUNCTION public.check_config_immutability();

-- Also protect SSS brackets from being changed if their parent table is published/superseded
CREATE OR REPLACE FUNCTION public.check_bracket_immutability()
RETURNS trigger AS $$
DECLARE
  parent_status text;
BEGIN
  -- Get the status of the parent table
  IF TG_OP = 'DELETE' THEN
    SELECT status INTO parent_status FROM public.government_contribution_tables WHERE id = OLD.contribution_table_id;
  ELSE
    SELECT status INTO parent_status FROM public.government_contribution_tables WHERE id = NEW.contribution_table_id;
  END IF;

  IF parent_status IN ('Published', 'Superseded') THEN
    RAISE EXCEPTION 'Cannot modify brackets of a % configuration.', parent_status;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_bracket_immutability
  BEFORE INSERT OR UPDATE OR DELETE ON public.government_contribution_brackets
  FOR EACH ROW EXECUTE FUNCTION public.check_bracket_immutability();
