-- CLEAR ALL DATA FROM SUPABASE DATABASE
-- Run this in Supabase SQL Editor to remove all old data

-- Clear all tables in correct order (respecting foreign key constraints)
DELETE FROM vote_receipts;
DELETE FROM enrollments;
DELETE FROM feedback;
DELETE FROM suggestions;
DELETE FROM votes;
DELETE FROM programs;
DELETE FROM profiles;

-- Keep settings table (contains admin code)
-- DELETE FROM settings; -- Uncomment if you want to reset admin code too

-- Verify all tables are empty
SELECT 'profiles' as table_name, COUNT(*) as records FROM profiles
UNION ALL
SELECT 'programs', COUNT(*) FROM programs
UNION ALL
SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL
SELECT 'feedback', COUNT(*) FROM feedback
UNION ALL
SELECT 'votes', COUNT(*) FROM votes
UNION ALL
SELECT 'vote_receipts', COUNT(*) FROM vote_receipts
UNION ALL
SELECT 'suggestions', COUNT(*) FROM suggestions
UNION ALL
SELECT 'settings', COUNT(*) FROM settings;

SELECT 'All data cleared successfully!' as status;