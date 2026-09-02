-- 011_rls.sql

-- Helper function to get current user's role name
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
    role_name TEXT;
BEGIN
    SELECT r.name INTO role_name
    FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid();
    RETURN role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security on all tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_compensation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_contribution_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_contribution_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holiday_pay_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Super Admin: Can do everything
-- 2. Payroll Admin: Can read all, manage employees/attendance/payroll, cannot manage config/roles
-- 3. Viewer: Read-only for dashboard/reports

-- Policies for Profiles (Everyone can read profiles, only Super Admin can edit roles)
CREATE POLICY "Super Admins can manage all profiles" ON public.profiles
    FOR ALL USING (public.get_user_role() = 'Super Admin');
CREATE POLICY "Users can read all profiles" ON public.profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

-- Policies for Roles
CREATE POLICY "Anyone can read roles" ON public.roles
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Super Admins can manage roles" ON public.roles
    FOR ALL USING (public.get_user_role() = 'Super Admin');

-- Policies for Company Settings & Configurations
-- (tax_tables, brackets, government contributions, holidays, company settings, etc.)
CREATE POLICY "Anyone can read configurations" ON public.company_settings
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Super Admins can manage configurations" ON public.company_settings
    FOR ALL USING (public.get_user_role() = 'Super Admin');

CREATE POLICY "Anyone can read tax_tables" ON public.tax_tables
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Super Admins can manage tax_tables" ON public.tax_tables
    FOR ALL USING (public.get_user_role() = 'Super Admin');

CREATE POLICY "Anyone can read tax_brackets" ON public.tax_brackets
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Super Admins can manage tax_brackets" ON public.tax_brackets
    FOR ALL USING (public.get_user_role() = 'Super Admin');

CREATE POLICY "Anyone can read government_contribution_tables" ON public.government_contribution_tables
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Super Admins can manage government_contribution_tables" ON public.government_contribution_tables
    FOR ALL USING (public.get_user_role() = 'Super Admin');

CREATE POLICY "Anyone can read government_contribution_brackets" ON public.government_contribution_brackets
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Super Admins can manage government_contribution_brackets" ON public.government_contribution_brackets
    FOR ALL USING (public.get_user_role() = 'Super Admin');

CREATE POLICY "Anyone can read holiday_pay_rules" ON public.holiday_pay_rules
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Super Admins can manage holiday_pay_rules" ON public.holiday_pay_rules
    FOR ALL USING (public.get_user_role() = 'Super Admin');

CREATE POLICY "Anyone can read holidays" ON public.holidays
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Super Admins can manage holidays" ON public.holidays
    FOR ALL USING (public.get_user_role() = 'Super Admin');

CREATE POLICY "Anyone can read leave_types" ON public.leave_types
    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Super Admins can manage leave_types" ON public.leave_types
    FOR ALL USING (public.get_user_role() = 'Super Admin');

-- Policies for Employees and Payroll data (Super Admin & Payroll Admin can manage, Viewer can read)
CREATE POLICY "Super & Payroll Admins can manage employees" ON public.employees
    FOR ALL USING (public.get_user_role() IN ('Super Admin', 'Payroll Admin'));
CREATE POLICY "Viewers can read employees" ON public.employees
    FOR SELECT USING (public.get_user_role() = 'Viewer');

CREATE POLICY "Super & Payroll Admins can manage attendance" ON public.attendance_records
    FOR ALL USING (public.get_user_role() IN ('Super Admin', 'Payroll Admin'));
CREATE POLICY "Viewers can read attendance" ON public.attendance_records
    FOR SELECT USING (public.get_user_role() = 'Viewer');

CREATE POLICY "Super & Payroll Admins can manage payroll_runs" ON public.payroll_runs
    FOR ALL USING (public.get_user_role() IN ('Super Admin', 'Payroll Admin'));
CREATE POLICY "Viewers can read payroll_runs" ON public.payroll_runs
    FOR SELECT USING (public.get_user_role() = 'Viewer');

-- (Apply similar policies to other employee/payroll related tables: employee_compensation_history, payroll_items, etc. 
-- For brevity here, we will just allow Super and Payroll Admins full access and Viewers read access to all relevant tables.)
DO $$
DECLARE
    table_name TEXT;
    target_tables TEXT[] := ARRAY[
        'employee_compensation_history', 'employee_deductions', 'timesheets',
        'employee_leave_balances', 'leave_requests', 'payroll_periods',
        'payroll_items', 'payroll_earnings', 'payroll_deductions', 'payroll_adjustments',
        'departments', 'positions'
    ];
BEGIN
    FOREACH table_name IN ARRAY target_tables
    LOOP
        EXECUTE format('CREATE POLICY "Admins manage %I" ON public.%I FOR ALL USING (public.get_user_role() IN (''Super Admin'', ''Payroll Admin''));', table_name, table_name);
        EXECUTE format('CREATE POLICY "Viewers read %I" ON public.%I FOR SELECT USING (public.get_user_role() = ''Viewer'');', table_name, table_name);
    END LOOP;
END $$;

-- Policies for Audit Logs (Only Super Admin can read all, NO ONE CAN UPDATE/DELETE, system inserts)
CREATE POLICY "Super Admins can read audit logs" ON public.audit_logs
    FOR SELECT USING (public.get_user_role() = 'Super Admin');
CREATE POLICY "Service Role can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true); -- Usually inserted via database triggers or server-side admin client
