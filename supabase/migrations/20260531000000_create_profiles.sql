-- Migration: 20260531000000_create_profiles.sql
-- Create persistent public.profiles table to track all players since launch

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (true);

-- Trigger function to sync from auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_auth_user_sync()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_key, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'Player'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_key', 'male1'),
    NEW.created_at,
    COALESCE(NEW.last_sign_in_at, NOW())
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    username = COALESCE(NEW.raw_user_meta_data->>'username', public.profiles.username),
    avatar_key = COALESCE(NEW.raw_user_meta_data->>'avatar_key', public.profiles.avatar_key),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert or update
CREATE OR REPLACE TRIGGER on_auth_user_sync
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_sync();

-- Retroactively populate profiles table from existing auth.users
INSERT INTO public.profiles (id, username, avatar_key, created_at, updated_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'username', 'Player'),
  COALESCE(raw_user_meta_data->>'avatar_key', 'male1'),
  created_at,
  COALESCE(last_sign_in_at, created_at)
FROM auth.users
ON CONFLICT (id) DO NOTHING;
