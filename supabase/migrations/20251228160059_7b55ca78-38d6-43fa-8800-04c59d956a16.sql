-- Weekly schedule table to assign templates to specific days
CREATE TABLE public.weekly_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.weekly_schedule ENABLE ROW LEVEL SECURITY;

-- RLS policies for weekly schedule
CREATE POLICY "Users can view their own schedule" ON public.weekly_schedule
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedule" ON public.weekly_schedule
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule" ON public.weekly_schedule
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule" ON public.weekly_schedule
  FOR DELETE USING (auth.uid() = user_id);

-- Friendships table for social features
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS policies for friendships
CREATE POLICY "Users can view friendships they're part of" ON public.friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they receive" ON public.friendships
  FOR UPDATE USING (auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friend requests" ON public.friendships
  FOR DELETE USING (auth.uid() = user_id);

-- Friend codes for easy sharing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS friend_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Add triggers for updated_at
CREATE TRIGGER update_weekly_schedule_updated_at
  BEFORE UPDATE ON public.weekly_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();