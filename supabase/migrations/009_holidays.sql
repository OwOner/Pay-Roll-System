-- 009_holidays.sql

-- Holiday Pay Rules (The config)
CREATE TABLE public.holiday_pay_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_type TEXT NOT NULL UNIQUE, -- e.g., 'Regular Holiday', 'Special Non-Working Holiday'
    multiplier NUMERIC(8,4) NOT NULL DEFAULT 1.0000, -- e.g., 2.0000 for 200%
    rest_day_multiplier NUMERIC(8,4) NOT NULL DEFAULT 1.0000, -- e.g., 2.6000 for Regular Holiday falling on rest day
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Holidays (The specific calendar dates)
CREATE TABLE public.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_date DATE NOT NULL,
    name TEXT NOT NULL,
    holiday_pay_rule_id UUID NOT NULL REFERENCES public.holiday_pay_rules(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(holiday_date)
);

-- Triggers
CREATE TRIGGER set_holiday_pay_rules_updated_at
BEFORE UPDATE ON public.holiday_pay_rules
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_holidays_updated_at
BEFORE UPDATE ON public.holidays
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
