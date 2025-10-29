-- Add password column to profiles table
ALTER TABLE profiles ADD COLUMN password TEXT;

-- Update existing profiles with a default password if any exist
UPDATE profiles SET password = 'password123' WHERE password IS NULL;