-- Drop the existing status check constraint
ALTER TABLE public.cash_advances DROP CONSTRAINT cash_advances_status_check;

-- Add the new status check constraint that includes 'Paused'
ALTER TABLE public.cash_advances ADD CONSTRAINT cash_advances_status_check CHECK (status IN ('Active', 'Partially Paid', 'Fully Paid', 'Cancelled', 'Paused'));
