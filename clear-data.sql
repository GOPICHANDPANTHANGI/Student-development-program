-- Clear all data from Supabase database
DELETE FROM public.vote_receipts;
DELETE FROM public.votes;
DELETE FROM public.suggestions;
DELETE FROM public.feedback;
DELETE FROM public.enrollments;
DELETE FROM public.programs;
DELETE FROM public.profiles;

-- Reset faculty code to IT2025
UPDATE public.settings SET value = jsonb_build_object('code','IT2025') WHERE key = 'faculty_code';