-- Migration: 043_seed_tax_tables
-- Description: Seed the 2023+ TRAIN/CREATE Revised Withholding Tax Tables (Annex E)

-- Create the main Tax Table entry
DO $$
DECLARE
    new_tax_table_id UUID;
BEGIN
    INSERT INTO public.tax_tables (name, effective_from, is_active)
    VALUES ('TRAIN/CREATE Law 2023 Onwards', '2023-01-01', true)
    RETURNING id INTO new_tax_table_id;

    -- ==========================================
    -- DAILY BRACKETS
    -- ==========================================
    INSERT INTO public.tax_brackets (tax_table_id, pay_frequency, tax_status, minimum_income, maximum_income, base_tax, excess_rate) VALUES
    (new_tax_table_id, 'Daily', 'Single/Married', 0, 685, 0.00, 0.00),
    (new_tax_table_id, 'Daily', 'Single/Married', 685, 1095, 0.00, 0.15),
    (new_tax_table_id, 'Daily', 'Single/Married', 1096, 2191, 61.65, 0.20),
    (new_tax_table_id, 'Daily', 'Single/Married', 2192, 5478, 280.85, 0.25),
    (new_tax_table_id, 'Daily', 'Single/Married', 5479, 21917, 1102.60, 0.30),
    (new_tax_table_id, 'Daily', 'Single/Married', 21918, NULL, 6034.00, 0.35);

    -- ==========================================
    -- WEEKLY BRACKETS
    -- ==========================================
    INSERT INTO public.tax_brackets (tax_table_id, pay_frequency, tax_status, minimum_income, maximum_income, base_tax, excess_rate) VALUES
    (new_tax_table_id, 'Weekly', 'Single/Married', 0, 4808, 0.00, 0.00),
    (new_tax_table_id, 'Weekly', 'Single/Married', 4808, 7691, 0.00, 0.15),
    (new_tax_table_id, 'Weekly', 'Single/Married', 7692, 15384, 432.60, 0.20),
    (new_tax_table_id, 'Weekly', 'Single/Married', 15385, 38461, 1971.20, 0.25),
    (new_tax_table_id, 'Weekly', 'Single/Married', 38462, 153845, 7740.45, 0.30),
    (new_tax_table_id, 'Weekly', 'Single/Married', 153846, NULL, 42355.65, 0.35);

    -- ==========================================
    -- SEMI-MONTHLY BRACKETS
    -- ==========================================
    INSERT INTO public.tax_brackets (tax_table_id, pay_frequency, tax_status, minimum_income, maximum_income, base_tax, excess_rate) VALUES
    (new_tax_table_id, 'Semi-Monthly', 'Single/Married', 0, 10417, 0.00, 0.00),
    (new_tax_table_id, 'Semi-Monthly', 'Single/Married', 10417, 16666, 0.00, 0.15),
    (new_tax_table_id, 'Semi-Monthly', 'Single/Married', 16667, 33332, 937.50, 0.20),
    (new_tax_table_id, 'Semi-Monthly', 'Single/Married', 33333, 83332, 4270.70, 0.25),
    (new_tax_table_id, 'Semi-Monthly', 'Single/Married', 83333, 333332, 16770.70, 0.30),
    (new_tax_table_id, 'Semi-Monthly', 'Single/Married', 333333, NULL, 91770.70, 0.35);

    -- ==========================================
    -- MONTHLY BRACKETS
    -- ==========================================
    INSERT INTO public.tax_brackets (tax_table_id, pay_frequency, tax_status, minimum_income, maximum_income, base_tax, excess_rate) VALUES
    (new_tax_table_id, 'Monthly', 'Single/Married', 0, 20833, 0.00, 0.00),
    (new_tax_table_id, 'Monthly', 'Single/Married', 20833, 33332, 0.00, 0.15),
    (new_tax_table_id, 'Monthly', 'Single/Married', 33333, 66666, 1875.00, 0.20),
    (new_tax_table_id, 'Monthly', 'Single/Married', 66667, 166666, 8541.80, 0.25),
    (new_tax_table_id, 'Monthly', 'Single/Married', 166667, 666666, 33541.80, 0.30),
    (new_tax_table_id, 'Monthly', 'Single/Married', 666667, NULL, 183541.80, 0.35);

END $$;
