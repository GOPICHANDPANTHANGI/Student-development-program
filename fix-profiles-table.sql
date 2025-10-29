-- Fix profiles table to auto-generate UUID
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();