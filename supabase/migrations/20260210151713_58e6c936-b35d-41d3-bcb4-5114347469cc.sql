
-- Add onboarding_completed and tier fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier text DEFAULT 'bronze';

-- Add image_url and video_url columns to exercise_library (video_url already exists)
ALTER TABLE public.exercise_library ADD COLUMN IF NOT EXISTS image_url text;
