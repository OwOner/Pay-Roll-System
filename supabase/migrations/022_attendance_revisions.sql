-- 022_attendance_revisions.sql

-- 1. Modify attendance_records
ALTER TABLE public.attendance_records
  ADD COLUMN last_modified_source TEXT,
  ADD COLUMN last_modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN last_modified_at TIMESTAMPTZ;

-- Initialize existing records to have their source as last_modified_source for consistency, though it's optional
UPDATE public.attendance_records SET last_modified_source = source WHERE last_modified_source IS NULL;

-- 2. Create attendance_revisions table
CREATE TABLE public.attendance_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_record_id UUID NOT NULL REFERENCES public.attendance_records(id) ON DELETE CASCADE,
    changed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    change_type TEXT NOT NULL, -- e.g., 'manual_correction', 'system_update'
    source_before TEXT,
    source_after TEXT,
    original_payload JSONB NOT NULL,
    corrected_payload JSONB NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. RLS for attendance_revisions
ALTER TABLE public.attendance_revisions ENABLE ROW LEVEL SECURITY;

-- Admins can read all revisions
CREATE POLICY "Admins can read attendance revisions" ON public.attendance_revisions
    FOR SELECT USING (public.get_user_role() IN ('Super Admin', 'Payroll Admin'));

-- Employees can read their own revisions
CREATE POLICY "Employees can read own attendance revisions" ON public.attendance_revisions
    FOR SELECT USING (
        attendance_record_id IN (
            SELECT id FROM public.attendance_records WHERE employee_id = public.get_user_employee_id()
        )
    );

-- Only service role / trusted backend can INSERT revisions (or Admins if we want to allow direct client inserts)
-- We will allow Admins to insert them.
CREATE POLICY "Admins can insert attendance revisions" ON public.attendance_revisions
    FOR INSERT WITH CHECK (public.get_user_role() IN ('Super Admin', 'Payroll Admin'));

-- Immutable: No UPDATE or DELETE policies are created. This ensures records cannot be modified once inserted.

-- 4. Automatically set last_modified_at on attendance_records (already handled by set_attendance_records_updated_at trigger for updated_at, but we can explicitly do it or just rely on the application to set last_modified_by and last_modified_source). We will rely on the application to pass these fields.
