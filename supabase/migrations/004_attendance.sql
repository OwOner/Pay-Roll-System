-- 004_attendance.sql

-- Attendance Records
CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    time_in TIME,
    time_out TIME,
    regular_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    overtime_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    night_differential_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    is_rest_day BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL, -- e.g., 'Present', 'Absent', 'Late', 'Half-day'
    remarks TEXT,
    
    -- Future: reference to holiday if it falls on a holiday
    -- holiday_id UUID REFERENCES public.holidays(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(employee_id, work_date)
);

-- Timesheets (Payroll Period Summary)
CREATE TABLE public.timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    total_regular_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    total_overtime_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    total_night_differential_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    total_rest_day_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    total_holiday_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    
    absent_days NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    late_undertime_hours NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    
    status TEXT NOT NULL DEFAULT 'Draft', -- 'Draft', 'Submitted', 'Approved', 'Processed'
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(employee_id, period_start, period_end)
);

-- Triggers
CREATE TRIGGER set_attendance_records_updated_at
BEFORE UPDATE ON public.attendance_records
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_timesheets_updated_at
BEFORE UPDATE ON public.timesheets
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
