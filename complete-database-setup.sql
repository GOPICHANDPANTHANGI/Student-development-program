-- COMPLETE DATABASE SETUP FOR SKILLQUEST
-- Run this entire script in Supabase SQL Editor

-- ENUM for roles (create only if it doesn't exist)
do $$ begin
    create type public.app_role as enum ('faculty','student');
exception
    when duplicate_object then null;
end $$;

-- Users profile (linked later when we wire Auth)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text,
  roll text unique,
  role public.app_role default 'student',
  password text,  -- Added password column
  created_at timestamptz default now()
);

-- Programs (SDPs)
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  status text check (status in ('upcoming','ongoing','completed')) default 'upcoming',
  capacity int default 30,
  created_at timestamptz default now()
);

-- Enrollments (student roll per program)
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs(id) on delete cascade not null,
  student_roll text not null,
  enrolled_at timestamptz default now(),
  unique(program_id, student_roll)
);

-- Feedback
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs(id) on delete cascade not null,
  student_roll text not null,
  student_name text,
  rating int check (rating between 1 and 5) not null,
  comment text,
  created_at timestamptz default now()
);

-- Topic votes (one vote per student per topic)
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  topic_title text not null,
  category text,
  votes int default 0,
  created_at timestamptz default now()
);

create table if not exists public.vote_receipts (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid references public.votes(id) on delete cascade not null,
  student_roll text not null,
  created_at timestamptz default now(),
  unique(vote_id, student_roll)
);

-- Suggestions (student ideas)
create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  student_roll text not null,
  student_name text,
  text text not null,
  created_at timestamptz default now()
);

-- App settings (for universal faculty code)
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

insert into public.settings(key, value)
values ('faculty_code', jsonb_build_object('code','IT2025'))
on conflict (key) do update set value = excluded.value, updated_at = now();

-- Add password column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password TEXT;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.programs enable row level security;
alter table public.enrollments enable row level security;
alter table public.feedback enable row level security;
alter table public.votes enable row level security;
alter table public.vote_receipts enable row level security;
alter table public.suggestions enable row level security;
alter table public.settings enable row level security;

-- Permissive policies for development
do $$
begin
  -- Drop existing policies if they exist
  drop policy if exists profiles_read on public.profiles;
  drop policy if exists profiles_write on public.profiles;
  drop policy if exists profiles_update on public.profiles;
  drop policy if exists programs_read on public.programs;
  drop policy if exists programs_write on public.programs;
  drop policy if exists programs_update on public.programs;
  drop policy if exists programs_delete on public.programs;
  drop policy if exists enrollments_read on public.enrollments;
  drop policy if exists enrollments_write on public.enrollments;
  drop policy if exists enrollments_delete on public.enrollments;
  drop policy if exists feedback_read on public.feedback;
  drop policy if exists feedback_write on public.feedback;
  drop policy if exists votes_read on public.votes;
  drop policy if exists votes_write on public.votes;
  drop policy if exists votes_update on public.votes;
  drop policy if exists votes_delete on public.votes;
  drop policy if exists voterec_read on public.vote_receipts;
  drop policy if exists voterec_write on public.vote_receipts;
  drop policy if exists suggestions_read on public.suggestions;
  drop policy if exists suggestions_write on public.suggestions;
  drop policy if exists settings_read on public.settings;
  drop policy if exists settings_update on public.settings;

  -- Create new policies
  create policy profiles_read on public.profiles for select using (true);
  create policy profiles_write on public.profiles for insert with check (true);
  create policy profiles_update on public.profiles for update using (true);
  
  create policy programs_read on public.programs for select using (true);
  create policy programs_write on public.programs for insert with check (true);
  create policy programs_update on public.programs for update using (true);
  create policy programs_delete on public.programs for delete using (true);
  
  create policy enrollments_read on public.enrollments for select using (true);
  create policy enrollments_write on public.enrollments for insert with check (true);
  create policy enrollments_delete on public.enrollments for delete using (true);
  
  create policy feedback_read on public.feedback for select using (true);
  create policy feedback_write on public.feedback for insert with check (true);
  
  create policy votes_read on public.votes for select using (true);
  create policy votes_write on public.votes for insert with check (true);
  create policy votes_update on public.votes for update using (true);
  create policy votes_delete on public.votes for delete using (true);
  
  create policy voterec_read on public.vote_receipts for select using (true);
  create policy voterec_write on public.vote_receipts for insert with check (true);
  
  create policy suggestions_read on public.suggestions for select using (true);
  create policy suggestions_write on public.suggestions for insert with check (true);
  
  create policy settings_read on public.settings for select using (true);
  create policy settings_update on public.settings for update using (true);
end $$;

-- Verification queries
SELECT 'Tables created successfully' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('profiles', 'programs', 'enrollments', 'feedback', 'votes', 'vote_receipts', 'suggestions', 'settings');
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND table_schema = 'public';