-- Clear all data from Supabase database
-- Run this in Supabase SQL Editor to completely reset the database

-- Clear all tables in correct order (respecting foreign key constraints)
DELETE FROM vote_receipts;
DELETE FROM enrollments;
DELETE FROM feedback;
DELETE FROM suggestions;
DELETE FROM votes;
DELETE FROM programs;
DELETE FROM profiles;

-- Reset any sequences if needed
-- ALTER SEQUENCE IF EXISTS profiles_id_seq RESTART WITH 1;

-- Verify all tables are empty
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'programs' as table_name, COUNT(*) as count FROM programs
UNION ALL
SELECT 'enrollments' as table_name, COUNT(*) as count FROM enrollments
UNION ALL
SELECT 'feedback' as table_name, COUNT(*) as count FROM feedback
UNION ALL
SELECT 'votes' as table_name, COUNT(*) as count FROM votes
UNION ALL
SELECT 'vote_receipts' as table_name, COUNT(*) as count FROM vote_receipts
UNION ALL
SELECT 'suggestions' as table_name, COUNT(*) as count FROM suggestions;