-- OPTION 1: DELETE QUIZ ATTEMPT FOR TODAY
-- This will allow the user to retake the quiz for the current day.
-- Replace 'USER_ID_HERE' with the actual user UUID if you want to target a specific user,
-- otherwise it deletes for all users who took a quiz today.

DELETE FROM quiz_attempts
WHERE 
  completed_at >= CURRENT_DATE 
  AND completed_at < CURRENT_DATE + INTERVAL '1 day';

-- Note: This does not revert the points or streak updates in the 'users' table 
-- because that would require complex calculation of what the previous state was.
-- However, taking the quiz again will just update the user stats forward.
-- If you want to strictly revert points/streak, you would need to manually update the users table.


-- OPTION 2: FULL RESET (DELETE ALL QUIZ DATA)
-- This wipes all progress, achievements, and stats for a fresh start.

-- 1. Truncate dependent tables
TRUNCATE TABLE quiz_attempts CASCADE;
TRUNCATE TABLE topic_performance CASCADE;
TRUNCATE TABLE achievements CASCADE;
TRUNCATE TABLE covered_subtopics CASCADE;

-- 2. Reset user stats (points, level, streak)
-- We don't delete the user, just reset the progress columns.
UPDATE users
SET 
  current_streak = 0,
  total_points = 0,
  level = 1,
  last_quiz_date = NULL;
