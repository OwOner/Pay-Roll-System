-- 006_payroll.sql

-- Payroll Periods
CREATE TABLE public.payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    pay_frequency TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(period_start, period_end, pay_frequency)
);

-- Payroll Runs
CREATE TABLE public.payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'Draft', -- 'Draft', 'Calculated', 'For Review', 'Pending Approval', 'Approved', 'Paid', 'Cancelled'
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    
    -- Optimistic locking
    version INTEGER NOT NULL DEFAULT 1,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(payroll_period_id)
);

-- Payroll Items (Individual Employee Payroll in a Run)
CREATE TABLE public.payroll_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    
    -- Snapshots of Config used
    tax_table_id UUID, -- Will reference tax_tables later
    sss_table_id UUID,
    philhealth_table_id UUID,
    pagibig_table_id UUID,
    calculation_engine_version TEXT NOT NULL,
    
    -- Totals
    gross_pay NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    taxable_income NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    non_taxable_income NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    withholding_tax NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_deductions NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    net_pay NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    
    -- Optimistic locking
    version INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(payroll_run_id, employee_id)
);

-- Payroll Earnings
CREATE TABLE public.payroll_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_item_id UUID NOT NULL REFERENCES public.payroll_items(id) ON DELETE CASCADE,
    description TEXT NOT NULL, -- 'Basic Pay', '13th Month Pay', 'Overtime', 'Holiday Pay', 'Allowance', etc.
    amount NUMERIC(12,2) NOT NULL,
    is_taxable BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit / Source Tracking
    source TEXT, -- e.g., 'attendance', 'leave', 'manual_entry', 'system_calc'
    source_id TEXT, -- e.g., Attendance Record ID, Leave Request ID
    
    -- Explicit Overrides
    calculated_amount NUMERIC(12,2),
    override_reason TEXT,
    override_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    override_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payroll Deductions
CREATE TABLE public.payroll_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_item_id UUID NOT NULL REFERENCES public.payroll_items(id) ON DELETE CASCADE,
    description TEXT NOT NULL, -- 'SSS', 'PhilHealth', 'Pag-IBIG', 'Salary Loan', etc.
    amount NUMERIC(12,2) NOT NULL,
    
    -- Audit / Source Tracking
    source TEXT, -- e.g., 'system_calc', 'recurring_deduction', 'manual_entry'
    source_id TEXT, 
    
    -- Explicit Overrides
    calculated_amount NUMERIC(12,2),
    override_reason TEXT,
    override_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    override_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payroll Adjustments (Post-Approval Corrections)
CREATE TABLE public.payroll_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    reference_payroll_item_id UUID REFERENCES public.payroll_items(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    adjustment_type TEXT NOT NULL, -- 'Earning', 'Deduction'
    description TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Processed'
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers
CREATE TRIGGER set_payroll_periods_updated_at
BEFORE UPDATE ON public.payroll_periods
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_payroll_runs_updated_at
BEFORE UPDATE ON public.payroll_runs
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_payroll_items_updated_at
BEFORE UPDATE ON public.payroll_items
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_payroll_earnings_updated_at
BEFORE UPDATE ON public.payroll_earnings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_payroll_deductions_updated_at
BEFORE UPDATE ON public.payroll_deductions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_payroll_adjustments_updated_at
BEFORE UPDATE ON public.payroll_adjustments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
