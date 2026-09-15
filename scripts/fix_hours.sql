-- Disable trigger
ALTER TABLE attendance_records DISABLE TRIGGER check_timesheet_status_before_attendance_change;

-- Update the hours
UPDATE attendance_records
SET regular_hours = 8
WHERE status IN ('Present', 'Work From Home', 'Holiday') AND regular_hours = 0;

-- Re-enable trigger
ALTER TABLE attendance_records ENABLE TRIGGER check_timesheet_status_before_attendance_change;
