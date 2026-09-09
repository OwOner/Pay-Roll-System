-- =============================================================================
-- Fix Saturday being wrongly classified as 'Scheduled Rest Day'
-- Run this AFTER updating your Work Policy to have only Sunday as a rest day.
-- This corrects existing timesheet_details and resets timesheets to Draft
-- so they can be regenerated cleanly.
-- =============================================================================

-- Step 1: Fix timesheet_details — change Saturday from 'Scheduled Rest Day' to 'Regular Workday'
UPDATE timesheet_details td
SET day_type = 'Regular Workday'
WHERE td.day_type = 'Scheduled Rest Day'
  AND EXTRACT(DOW FROM td.date::date) = 6;  -- 6 = Saturday

-- Step 2: Mark all affected timesheets as Stale so the UI prompts regeneration
UPDATE timesheets ts
SET is_stale = true, status = 'Draft'
WHERE ts.id IN (
  SELECT DISTINCT td.timesheet_id
  FROM timesheet_details td
  WHERE EXTRACT(DOW FROM td.date::date) = 6  -- Saturday rows
);

-- Step 3: Verify — show count of Saturday rows that still have rest day type (should be 0)
SELECT COUNT(*) AS remaining_saturday_rest_days
FROM timesheet_details
WHERE day_type = 'Scheduled Rest Day'
  AND EXTRACT(DOW FROM date::date) = 6;
