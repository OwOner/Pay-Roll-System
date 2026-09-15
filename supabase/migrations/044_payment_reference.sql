-- Add payment_reference to payroll_status_history
ALTER TABLE public.payroll_status_history ADD COLUMN payment_reference TEXT;
