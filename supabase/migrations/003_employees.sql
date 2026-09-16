-- 003_employees.sql

-- Employment Status Enum
CREATE TYPE employment_status AS ENUM ('Active', 'On Leave', 'Inactive', 'Terminated');

-- Employees
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    birth_date DATE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
    employment_status employment_status NOT NULL DEFAULT 'Active',
    employment_type TEXT NOT NULL, -- e.g., 'Regular', 'Probationary', 'Contractual'
    date_hired DATE NOT NULL,
    termination_date DATE,
    avatar_url TEXT,
    
    -- Government Numbers
    sss_number TEXT,
    philhealth_number TEXT,
    pagibig_number TEXT,
    tin_number TEXT,
    
    -- Banking Info
    bank_name TEXT,
    bank_account TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employee Compensation History
CREATE TABLE public.employee_compensation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    salary_type TEXT NOT NULL, -- e.g., 'Monthly', 'Daily', 'Hourly'
    basic_salary NUMERIC(12,2) NOT NULL,
    daily_rate NUMERIC(12,2),
    hourly_rate NUMERIC(12,2),
    pay_frequency TEXT NOT NULL, -- e.g., 'Semi-monthly', 'Monthly', 'Weekly'
    working_hours_per_day NUMERIC(8,2) NOT NULL DEFAULT 8.00,
    working_days_per_week NUMERIC(8,2) NOT NULL DEFAULT 5.00,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (effective_to IS NULL OR effective_from <= effective_to)
);

-- Employee Recurring Deductions (e.g., Salary Loan)
CREATE TABLE public.employee_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    frequency TEXT NOT NULL, -- e.g., 'Every Payroll', 'First Period', 'Second Period'
    start_date DATE NOT NULL,
    end_date DATE,
    remaining_balance NUMERIC(12,2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers for updated_at
CREATE TRIGGER set_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_employee_compensation_history_updated_at
BEFORE UPDATE ON public.employee_compensation_history
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_employee_deductions_updated_at
BEFORE UPDATE ON public.employee_deductions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
