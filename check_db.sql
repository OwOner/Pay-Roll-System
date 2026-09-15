SELECT 
  (SELECT count(*) FROM employees) as emp_count,
  (SELECT count(*) FROM payroll_runs) as run_count,
  (SELECT count(*) FROM cash_advances) as ca_count,
  (SELECT count(*) FROM timesheets) as ts_count;
