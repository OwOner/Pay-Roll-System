-- 015_status_history_rls.sql

ALTER TABLE public.payroll_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage payroll_status_history" ON public.payroll_status_history
    FOR ALL USING (public.get_user_role() IN ('Super Admin', 'Payroll Admin'));

CREATE POLICY "Viewers read payroll_status_history" ON public.payroll_status_history
    FOR SELECT USING (public.get_user_role() = 'Viewer');
