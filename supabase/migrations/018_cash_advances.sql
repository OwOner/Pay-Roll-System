-- Create cash_advances table
CREATE TABLE public.cash_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    reason TEXT,
    repayment_amount_per_payroll NUMERIC(10, 2) NOT NULL CHECK (repayment_amount_per_payroll > 0),
    remaining_balance NUMERIC(10, 2) NOT NULL CHECK (remaining_balance >= 0),
    status TEXT NOT NULL CHECK (status IN ('Active', 'Partially Paid', 'Fully Paid', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cash_advance_repayments table
CREATE TABLE public.cash_advance_repayments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cash_advance_id UUID NOT NULL REFERENCES public.cash_advances(id) ON DELETE CASCADE,
    payroll_run_id UUID REFERENCES public.payroll_runs(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    repayment_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for cash_advances
ALTER TABLE public.cash_advances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.cash_advances
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS for cash_advance_repayments
ALTER TABLE public.cash_advance_repayments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.cash_advance_repayments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_cash_advances_updated_at
    BEFORE UPDATE ON public.cash_advances
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_cash_advance_repayments_updated_at
    BEFORE UPDATE ON public.cash_advance_repayments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
