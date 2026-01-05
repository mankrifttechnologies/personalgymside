-- User Badges table for gamification
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges"
ON public.user_badges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
ON public.user_badges FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Friends can view badges
CREATE POLICY "Friends can view friend badges"
ON public.user_badges FOR SELECT
USING (EXISTS (
  SELECT 1 FROM friendships f
  WHERE f.status = 'accepted'
  AND ((f.user_id = auth.uid() AND f.friend_id = user_badges.user_id)
    OR (f.friend_id = auth.uid() AND f.user_id = user_badges.user_id))
));

-- XP and Level tracking in profiles (add columns)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Water intake tracking
CREATE TABLE public.water_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount_ml INTEGER NOT NULL DEFAULT 250,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.water_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own water entries"
ON public.water_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own water entries"
ON public.water_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own water entries"
ON public.water_entries FOR DELETE
USING (auth.uid() = user_id);

-- Meal plans table
CREATE TABLE public.meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  meals JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own meal plans"
ON public.meal_plans FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Exercise library (system + user custom)
CREATE TABLE public.exercise_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  video_url TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view system exercises"
ON public.exercise_library FOR SELECT
USING (is_system = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own exercises"
ON public.exercise_library FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can update their own exercises"
ON public.exercise_library FOR UPDATE
USING (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can delete their own exercises"
ON public.exercise_library FOR DELETE
USING (auth.uid() = user_id AND is_system = false);

-- Insert default system exercises
INSERT INTO public.exercise_library (name, muscle_group, description, instructions, is_system) VALUES
-- Chest
('Bench Press', 'chest', 'Classic chest compound exercise', 'Lie flat on bench, grip bar slightly wider than shoulders, lower to chest, press up.', true),
('Incline Dumbbell Press', 'chest', 'Upper chest focus', 'Set bench to 30-45 degrees, press dumbbells up from shoulder level.', true),
('Cable Flyes', 'chest', 'Chest isolation', 'Stand between cables, slight lean forward, bring handles together in arc motion.', true),
('Push-ups', 'chest', 'Bodyweight chest exercise', 'Hands shoulder-width, lower chest to floor, push back up maintaining plank.', true),
-- Back
('Pull-ups', 'back', 'Vertical pulling movement', 'Hang from bar, pull chin above bar, control the descent.', true),
('Barbell Rows', 'back', 'Horizontal rowing compound', 'Bend over, pull bar to lower chest, squeeze shoulder blades.', true),
('Lat Pulldown', 'back', 'Machine vertical pull', 'Pull bar to upper chest, control the negative.', true),
('Deadlift', 'back', 'Full posterior chain', 'Hip hinge, grip bar, drive through heels, lockout at top.', true),
-- Shoulders
('Overhead Press', 'shoulders', 'Shoulder compound press', 'Press bar from shoulders to overhead, lock out arms.', true),
('Lateral Raises', 'shoulders', 'Side delt isolation', 'Raise dumbbells to side until parallel with ground.', true),
('Face Pulls', 'shoulders', 'Rear delt and rotator cuff', 'Pull rope to face level, externally rotate at end.', true),
-- Biceps
('Barbell Curls', 'biceps', 'Bicep mass builder', 'Curl bar up keeping elbows stationary, squeeze at top.', true),
('Hammer Curls', 'biceps', 'Neutral grip curls', 'Curl dumbbells with palms facing each other.', true),
('Incline Curls', 'biceps', 'Stretched position curls', 'Lie on incline bench, let arms hang, curl up.', true),
-- Triceps
('Tricep Dips', 'triceps', 'Bodyweight tricep exercise', 'Lower body until arms at 90 degrees, press back up.', true),
('Skull Crushers', 'triceps', 'Lying tricep extension', 'Lower bar to forehead, extend arms back up.', true),
('Rope Pushdowns', 'triceps', 'Cable tricep isolation', 'Push rope down and apart at bottom, squeeze.', true),
-- Legs
('Squats', 'legs', 'King of leg exercises', 'Bar on traps, squat to parallel or below, drive up.', true),
('Leg Press', 'legs', 'Machine leg compound', 'Press platform away, dont lock knees, control descent.', true),
('Romanian Deadlift', 'legs', 'Hamstring focused', 'Hip hinge with slight knee bend, feel hamstring stretch.', true),
('Leg Curls', 'legs', 'Hamstring isolation', 'Curl pad towards glutes, squeeze at top.', true),
('Calf Raises', 'legs', 'Calf development', 'Rise onto toes, pause at top, lower with control.', true),
-- Abs
('Planks', 'abs', 'Core stabilization', 'Hold plank position, keep body in straight line.', true),
('Cable Crunches', 'abs', 'Weighted ab exercise', 'Kneel at cable, crunch down bringing elbows to knees.', true),
('Hanging Leg Raises', 'abs', 'Lower ab focus', 'Hang from bar, raise legs to parallel or higher.', true);