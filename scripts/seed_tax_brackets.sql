-- Seed tax brackets for the existing tax table

DO $$
DECLARE
    table_id UUID := 'd3b2fdb1-7423-4fd0-b563-097c2d77f0cd';
BEGIN
    -- Delete existing just in case
    DELETE FROM public.tax_brackets WHERE tax_table_id = table_id;

    -- WEEKLY
    INSERT INTO public.tax_brackets (tax_table_id, pay_frequency, minimum_income, maximum_income, base_tax, excess_rate) VALUES
    (table_id, 'Weekly', 0, 4807.99, 0, 0),
    (table_id, 'Weekly', 4808, 7691.99, 0, 0.15),
    (table_id, 'Weekly', 7692, 15384.99, 432.60, 0.20),
    (table_id, 'Weekly', 15385, 38461.99, 1971.20, 0.25),
    (table_id, 'Weekly', 38462, 153845.99, 7740.45, 0.30),
    (table_id, 'Weekly', 153846, null, 42355.65, 0.35);

    -- SEMI-MONTHLY
    INSERT INTO public.tax_brackets (tax_table_id, pay_frequency, minimum_income, maximum_income, base_tax, excess_rate) VALUES
    (table_id, 'Semi-Monthly', 0, 10416.99, 0, 0),
    (table_id, 'Semi-Monthly', 10417, 16666.99, 0, 0.15),
    (table_id, 'Semi-Monthly', 16667, 33332.99, 937.50, 0.20),
    (table_id, 'Semi-Monthly', 33333, 83332.99, 4270.70, 0.25),
    (table_id, 'Semi-Monthly', 83333, 333332.99, 16770.70, 0.30),
    (table_id, 'Semi-Monthly', 333333, null, 91770.70, 0.35);

    -- MONTHLY
    INSERT INTO public.tax_brackets (tax_table_id, pay_frequency, minimum_income, maximum_income, base_tax, excess_rate) VALUES
    (table_id, 'Monthly', 0, 20832.99, 0, 0),
    (table_id, 'Monthly', 20833, 33332.99, 0, 0.15),
    (table_id, 'Monthly', 33333, 66666.99, 1875, 0.20),
    (table_id, 'Monthly', 66667, 166666.99, 8541.80, 0.25),
    (table_id, 'Monthly', 166667, 666666.99, 33541.80, 0.30),
    (table_id, 'Monthly', 666667, null, 183541.80, 0.35);

    -- DAILY
    INSERT INTO public.tax_brackets (tax_table_id, pay_frequency, minimum_income, maximum_income, base_tax, excess_rate) VALUES
    (table_id, 'Daily', 0, 684.99, 0, 0),
    (table_id, 'Daily', 685, 1095.99, 0, 0.15),
    (table_id, 'Daily', 1096, 2191.99, 61.65, 0.20),
    (table_id, 'Daily', 2192, 5478.99, 280.85, 0.25),
    (table_id, 'Daily', 5479, 21917.99, 1102.60, 0.30),
    (table_id, 'Daily', 21918, null, 6034.30, 0.35);
END $$;
