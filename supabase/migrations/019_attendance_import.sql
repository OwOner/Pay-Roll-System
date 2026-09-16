-- 019_attendance_import.sql

-- 1. Create Projects Table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Modify Attendance Records
ALTER TABLE public.attendance_records
  ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN source TEXT DEFAULT 'manual_entry',
  ADD COLUMN import_batch_id TEXT,
  ADD COLUMN internal_notes TEXT;

-- Safely convert TIME columns to TIMESTAMP by combining with work_date
ALTER TABLE public.attendance_records
  ALTER COLUMN time_in TYPE TIMESTAMP USING (work_date + time_in),
  ALTER COLUMN time_out TYPE TIMESTAMP USING (work_date + time_out);
