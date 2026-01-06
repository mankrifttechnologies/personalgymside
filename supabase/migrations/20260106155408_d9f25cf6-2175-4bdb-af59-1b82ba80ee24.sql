-- Create weekly challenges table
CREATE TABLE public.weekly_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL, -- 'workouts', 'calories', 'water', 'exercises'
  target_value INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 100,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user challenge progress table
CREATE TABLE public.user_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  current_progress INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- Everyone can view active challenges
CREATE POLICY "Everyone can view active challenges" 
ON public.weekly_challenges 
FOR SELECT 
USING (is_active = true);

-- Users can view their own challenge progress
CREATE POLICY "Users can view their own challenge progress" 
ON public.user_challenges 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can join challenges
CREATE POLICY "Users can join challenges" 
ON public.user_challenges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own progress" 
ON public.user_challenges 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Insert initial weekly challenges
INSERT INTO public.weekly_challenges (title, description, challenge_type, target_value, xp_reward, start_date, end_date) VALUES
('Workout Warrior', 'Complete 5 workouts this week', 'workouts', 5, 200, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'),
('Hydration Hero', 'Drink 14L of water this week', 'water', 14000, 150, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'),
('Calorie Counter', 'Log 21 meals this week', 'calories', 21, 175, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'),
('Iron Pumper', 'Complete 50 exercise sets', 'exercises', 50, 250, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days');