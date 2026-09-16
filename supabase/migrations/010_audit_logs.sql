-- 010_audit_logs.sql

-- Audit Logs Table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g., 'UPDATE', 'INSERT', 'DELETE', 'APPROVE_PAYROLL'
    entity_type TEXT NOT NULL, -- e.g., 'employees', 'payroll_items', 'tax_brackets'
    entity_id UUID, -- Optional, ID of the record affected
    old_data JSONB, -- Previous state
    new_data JSONB, -- New state
    reason TEXT, -- Reason for the change (especially for manual overrides)
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying audit logs by entity or user efficiently
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
