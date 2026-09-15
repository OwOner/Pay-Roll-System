-- Clear all attendance records with a work_date strictly after today (2026-09-08)
-- This removes records that were incorrectly pre-filled for dates that haven't happened yet.

DELETE FROM attendance_records
WHERE work_date > CURRENT_DATE;

-- Confirm how many rows remain and what was deleted
SELECT COUNT(*) AS remaining_records FROM attendance_records;
