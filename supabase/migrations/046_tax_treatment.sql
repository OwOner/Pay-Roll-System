-- Create an enum for tax treatment
CREATE TYPE tax_treatment_type AS ENUM ('taxable', 'non_taxable', 'mwe_exempt', 'de_minimis', 'statutory_exempt');

-- Add tax_treatment column to payroll_earnings
ALTER TABLE payroll_earnings
  ADD COLUMN tax_treatment tax_treatment_type DEFAULT 'taxable';
