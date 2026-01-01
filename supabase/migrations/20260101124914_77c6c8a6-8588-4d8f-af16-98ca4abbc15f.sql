-- Create messages table for friend chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view their messages"
ON public.messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Users can mark messages as read (only receiver)
CREATE POLICY "Users can update messages they received"
ON public.messages
FOR UPDATE
USING (auth.uid() = receiver_id);

-- Users can delete their own sent messages
CREATE POLICY "Users can delete their sent messages"
ON public.messages
FOR DELETE
USING (auth.uid() = sender_id);

-- Create activity feed table
CREATE TABLE public.activity_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- Users can view their own activities
CREATE POLICY "Users can view their own activities"
ON public.activity_feed
FOR SELECT
USING (auth.uid() = user_id);

-- Friends can view activities of accepted friends
CREATE POLICY "Friends can view friend activities"
ON public.activity_feed
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.status = 'accepted'
    AND (
      (f.user_id = auth.uid() AND f.friend_id = activity_feed.user_id)
      OR (f.friend_id = auth.uid() AND f.user_id = activity_feed.user_id)
    )
  )
);

-- Users can insert their own activities
CREATE POLICY "Users can insert their own activities"
ON public.activity_feed
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own activities
CREATE POLICY "Users can delete their own activities"
ON public.activity_feed
FOR DELETE
USING (auth.uid() = user_id);

-- Add RLS policy for friends to view each other's profiles
CREATE POLICY "Friends can view friend profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR is_public = true
  OR EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.status = 'accepted'
    AND (
      (f.user_id = auth.uid() AND f.friend_id = profiles.user_id)
      OR (f.friend_id = auth.uid() AND f.user_id = profiles.user_id)
    )
  )
);

-- Drop existing profile select policy to avoid conflict
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Add policies for friends to view each other's workouts
CREATE POLICY "Friends can view friend workouts"
ON public.workouts
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.status = 'accepted'
    AND (
      (f.user_id = auth.uid() AND f.friend_id = workouts.user_id)
      OR (f.friend_id = auth.uid() AND f.user_id = workouts.user_id)
    )
  )
);

-- Drop existing workout select policy to avoid conflict
DROP POLICY IF EXISTS "Users can view their own workouts" ON public.workouts;

-- Add policies for friends to view each other's PRs
CREATE POLICY "Friends can view friend PRs"
ON public.personal_records
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.status = 'accepted'
    AND (
      (f.user_id = auth.uid() AND f.friend_id = personal_records.user_id)
      OR (f.friend_id = auth.uid() AND f.user_id = personal_records.user_id)
    )
  )
);

-- Drop existing PR select policy
DROP POLICY IF EXISTS "Users can view their own PRs" ON public.personal_records;

-- Add policies for friends to view measurements
CREATE POLICY "Friends can view friend measurements"
ON public.body_measurements
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.status = 'accepted'
    AND (
      (f.user_id = auth.uid() AND f.friend_id = body_measurements.user_id)
      OR (f.friend_id = auth.uid() AND f.user_id = body_measurements.user_id)
    )
  )
);

-- Drop existing measurement select policy
DROP POLICY IF EXISTS "Users can view their own measurements" ON public.body_measurements;

-- Add policies for friends to view calorie entries
CREATE POLICY "Friends can view friend calories"
ON public.calorie_entries
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.status = 'accepted'
    AND (
      (f.user_id = auth.uid() AND f.friend_id = calorie_entries.user_id)
      OR (f.friend_id = auth.uid() AND f.user_id = calorie_entries.user_id)
    )
  )
);

-- Drop existing calorie select policy
DROP POLICY IF EXISTS "Users can view their own calorie entries" ON public.calorie_entries;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;