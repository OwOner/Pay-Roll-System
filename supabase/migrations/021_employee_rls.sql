-- 021_employee_rls.sql

-- Helper function to get current user's employee_id
CREATE OR REPLACE FUNCTION public.get_user_employee_id()
RETURNS UUID AS $$
DECLARE
    emp_id UUID;
BEGIN
    SELECT p.employee_id INTO emp_id
    FROM public.profiles p
    WHERE p.id = auth.uid();
    RETURN emp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Employees can read their own attendance records
CREATE POLICY "Employees can read own attendance" ON public.attendance_records
    FOR SELECT USING (
        employee_id = public.get_user_employee_id()
    );

-- Employees can read their own payroll payslips
CREATE POLICY "Employees can read own payroll items" ON public.payroll_items
    FOR SELECT USING (
        employee_id = public.get_user_employee_id()
    );

-- Employees can read their own leave requests
CREATE POLICY "Employees can read own leave requests" ON public.leave_requests
    FOR SELECT USING (
        employee_id = public.get_user_employee_id()
    );

-- Employees can read their own leave balances
CREATE POLICY "Employees can read own leave balances" ON public.employee_leave_balances
    FOR SELECT USING (
        employee_id = public.get_user_employee_id()
    );

-- Employees can read their own employee profile
CREATE POLICY "Employees can read own profile" ON public.employees
    FOR SELECT USING (
        id = public.get_user_employee_id()
    );
