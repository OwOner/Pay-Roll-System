-- 024_new_table_rls.sql
-- Enable RLS on the new PhilHealth and Pag-IBIG config tables
-- with read-access for all authenticated users.

ALTER TABLE public.philhealth_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagibig_configs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read government configurations
CREATE POLICY "philhealth_configs_select" ON public.philhealth_configs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "pagibig_configs_select" ON public.pagibig_configs
  FOR SELECT TO authenticated USING (true);

-- Only super_admin can insert/update/delete
CREATE POLICY "philhealth_configs_admin_write" ON public.philhealth_configs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON r.id = p.role_id
      WHERE p.id = auth.uid() AND r.name = 'super_admin'
    )
  );

CREATE POLICY "pagibig_configs_admin_write" ON public.pagibig_configs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON r.id = p.role_id
      WHERE p.id = auth.uid() AND r.name = 'super_admin'
    )
  );
