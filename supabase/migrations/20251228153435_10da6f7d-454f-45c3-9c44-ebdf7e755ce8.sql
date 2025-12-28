-- Create workout reminders table
CREATE TABLE public.workout_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reminder_time TIME NOT NULL DEFAULT '09:00:00',
  days_of_week INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5], -- 0=Sunday, 1=Monday, etc.
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_message TEXT DEFAULT 'Time to hit the gym! 💪',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create body measurements table
CREATE TABLE public.body_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC,
  body_fat_percentage NUMERIC,
  chest_cm NUMERIC,
  waist_cm NUMERIC,
  hips_cm NUMERIC,
  biceps_cm NUMERIC,
  thighs_cm NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create personal records table
CREATE TABLE public.personal_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  max_weight_kg NUMERIC NOT NULL,
  max_reps INTEGER NOT NULL DEFAULT 1,
  achieved_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_name)
);

-- Create workout templates table
CREATE TABLE public.workout_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'push', 'pull', 'legs', 'upper', 'lower', 'full_body'
  is_system BOOLEAN NOT NULL DEFAULT false, -- system templates vs user-created
  user_id UUID, -- null for system templates
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout template exercises table
CREATE TABLE public.workout_template_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps INTEGER NOT NULL DEFAULT 10,
  order_index INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.workout_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_template_exercises ENABLE ROW LEVEL SECURITY;

-- RLS policies for workout_reminders
CREATE POLICY "Users can view their own reminders" ON public.workout_reminders
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders" ON public.workout_reminders
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders" ON public.workout_reminders
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" ON public.workout_reminders
FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for body_measurements
CREATE POLICY "Users can view their own measurements" ON public.body_measurements
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own measurements" ON public.body_measurements
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own measurements" ON public.body_measurements
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own measurements" ON public.body_measurements
FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for personal_records
CREATE POLICY "Users can view their own PRs" ON public.personal_records
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PRs" ON public.personal_records
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PRs" ON public.personal_records
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PRs" ON public.personal_records
FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for workout_templates (system templates visible to all, user templates only to owner)
CREATE POLICY "Users can view system templates and their own" ON public.workout_templates
FOR SELECT USING (is_system = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates" ON public.workout_templates
FOR INSERT WITH CHECK (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can update their own templates" ON public.workout_templates
FOR UPDATE USING (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can delete their own templates" ON public.workout_templates
FOR DELETE USING (auth.uid() = user_id AND is_system = false);

-- RLS policies for workout_template_exercises
CREATE POLICY "Users can view exercises of accessible templates" ON public.workout_template_exercises
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.workout_templates t 
    WHERE t.id = template_id AND (t.is_system = true OR t.user_id = auth.uid())
  )
);

CREATE POLICY "Users can insert exercises for their templates" ON public.workout_template_exercises
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workout_templates t 
    WHERE t.id = template_id AND t.user_id = auth.uid() AND t.is_system = false
  )
);

CREATE POLICY "Users can update exercises for their templates" ON public.workout_template_exercises
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.workout_templates t 
    WHERE t.id = template_id AND t.user_id = auth.uid() AND t.is_system = false
  )
);

CREATE POLICY "Users can delete exercises for their templates" ON public.workout_template_exercises
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.workout_templates t 
    WHERE t.id = template_id AND t.user_id = auth.uid() AND t.is_system = false
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_workout_reminders_updated_at
BEFORE UPDATE ON public.workout_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personal_records_updated_at
BEFORE UPDATE ON public.personal_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert system workout templates
INSERT INTO public.workout_templates (name, description, category, is_system) VALUES
('Push Day', 'Focus on chest, shoulders, and triceps', 'push', true),
('Pull Day', 'Focus on back and biceps', 'pull', true),
('Leg Day', 'Complete lower body workout', 'legs', true),
('Upper Body', 'Full upper body workout', 'upper', true),
('Lower Body', 'Full lower body workout', 'lower', true),
('Full Body', 'Complete full body workout', 'full_body', true);

-- Insert exercises for Push Day
INSERT INTO public.workout_template_exercises (template_id, exercise_name, muscle_group, sets, reps, order_index)
SELECT id, 'Bench Press', 'chest', 4, 8, 1 FROM public.workout_templates WHERE name = 'Push Day' AND is_system = true
UNION ALL
SELECT id, 'Incline Dumbbell Press', 'chest', 3, 10, 2 FROM public.workout_templates WHERE name = 'Push Day' AND is_system = true
UNION ALL
SELECT id, 'Overhead Press', 'shoulders', 4, 8, 3 FROM public.workout_templates WHERE name = 'Push Day' AND is_system = true
UNION ALL
SELECT id, 'Lateral Raises', 'shoulders', 3, 12, 4 FROM public.workout_templates WHERE name = 'Push Day' AND is_system = true
UNION ALL
SELECT id, 'Tricep Pushdown', 'triceps', 3, 12, 5 FROM public.workout_templates WHERE name = 'Push Day' AND is_system = true
UNION ALL
SELECT id, 'Skull Crushers', 'triceps', 3, 10, 6 FROM public.workout_templates WHERE name = 'Push Day' AND is_system = true;

-- Insert exercises for Pull Day
INSERT INTO public.workout_template_exercises (template_id, exercise_name, muscle_group, sets, reps, order_index)
SELECT id, 'Deadlift', 'back', 4, 5, 1 FROM public.workout_templates WHERE name = 'Pull Day' AND is_system = true
UNION ALL
SELECT id, 'Lat Pulldown', 'back', 4, 10, 2 FROM public.workout_templates WHERE name = 'Pull Day' AND is_system = true
UNION ALL
SELECT id, 'Barbell Row', 'back', 4, 8, 3 FROM public.workout_templates WHERE name = 'Pull Day' AND is_system = true
UNION ALL
SELECT id, 'Face Pulls', 'shoulders', 3, 15, 4 FROM public.workout_templates WHERE name = 'Pull Day' AND is_system = true
UNION ALL
SELECT id, 'Barbell Curl', 'biceps', 3, 10, 5 FROM public.workout_templates WHERE name = 'Pull Day' AND is_system = true
UNION ALL
SELECT id, 'Hammer Curl', 'biceps', 3, 12, 6 FROM public.workout_templates WHERE name = 'Pull Day' AND is_system = true;

-- Insert exercises for Leg Day
INSERT INTO public.workout_template_exercises (template_id, exercise_name, muscle_group, sets, reps, order_index)
SELECT id, 'Squats', 'legs', 4, 8, 1 FROM public.workout_templates WHERE name = 'Leg Day' AND is_system = true
UNION ALL
SELECT id, 'Romanian Deadlift', 'legs', 4, 10, 2 FROM public.workout_templates WHERE name = 'Leg Day' AND is_system = true
UNION ALL
SELECT id, 'Leg Press', 'legs', 3, 12, 3 FROM public.workout_templates WHERE name = 'Leg Day' AND is_system = true
UNION ALL
SELECT id, 'Leg Curl', 'legs', 3, 12, 4 FROM public.workout_templates WHERE name = 'Leg Day' AND is_system = true
UNION ALL
SELECT id, 'Leg Extension', 'legs', 3, 12, 5 FROM public.workout_templates WHERE name = 'Leg Day' AND is_system = true
UNION ALL
SELECT id, 'Calf Raises', 'legs', 4, 15, 6 FROM public.workout_templates WHERE name = 'Leg Day' AND is_system = true;

-- Insert exercises for Upper Body
INSERT INTO public.workout_template_exercises (template_id, exercise_name, muscle_group, sets, reps, order_index)
SELECT id, 'Bench Press', 'chest', 4, 8, 1 FROM public.workout_templates WHERE name = 'Upper Body' AND is_system = true
UNION ALL
SELECT id, 'Barbell Row', 'back', 4, 8, 2 FROM public.workout_templates WHERE name = 'Upper Body' AND is_system = true
UNION ALL
SELECT id, 'Overhead Press', 'shoulders', 3, 10, 3 FROM public.workout_templates WHERE name = 'Upper Body' AND is_system = true
UNION ALL
SELECT id, 'Lat Pulldown', 'back', 3, 10, 4 FROM public.workout_templates WHERE name = 'Upper Body' AND is_system = true
UNION ALL
SELECT id, 'Dumbbell Curl', 'biceps', 3, 12, 5 FROM public.workout_templates WHERE name = 'Upper Body' AND is_system = true
UNION ALL
SELECT id, 'Tricep Pushdown', 'triceps', 3, 12, 6 FROM public.workout_templates WHERE name = 'Upper Body' AND is_system = true;

-- Insert exercises for Lower Body
INSERT INTO public.workout_template_exercises (template_id, exercise_name, muscle_group, sets, reps, order_index)
SELECT id, 'Squats', 'legs', 4, 8, 1 FROM public.workout_templates WHERE name = 'Lower Body' AND is_system = true
UNION ALL
SELECT id, 'Romanian Deadlift', 'legs', 4, 10, 2 FROM public.workout_templates WHERE name = 'Lower Body' AND is_system = true
UNION ALL
SELECT id, 'Lunges', 'legs', 3, 10, 3 FROM public.workout_templates WHERE name = 'Lower Body' AND is_system = true
UNION ALL
SELECT id, 'Leg Press', 'legs', 3, 12, 4 FROM public.workout_templates WHERE name = 'Lower Body' AND is_system = true
UNION ALL
SELECT id, 'Leg Curl', 'legs', 3, 12, 5 FROM public.workout_templates WHERE name = 'Lower Body' AND is_system = true
UNION ALL
SELECT id, 'Calf Raises', 'legs', 4, 15, 6 FROM public.workout_templates WHERE name = 'Lower Body' AND is_system = true;

-- Insert exercises for Full Body
INSERT INTO public.workout_template_exercises (template_id, exercise_name, muscle_group, sets, reps, order_index)
SELECT id, 'Squats', 'legs', 3, 8, 1 FROM public.workout_templates WHERE name = 'Full Body' AND is_system = true
UNION ALL
SELECT id, 'Bench Press', 'chest', 3, 8, 2 FROM public.workout_templates WHERE name = 'Full Body' AND is_system = true
UNION ALL
SELECT id, 'Barbell Row', 'back', 3, 8, 3 FROM public.workout_templates WHERE name = 'Full Body' AND is_system = true
UNION ALL
SELECT id, 'Overhead Press', 'shoulders', 3, 10, 4 FROM public.workout_templates WHERE name = 'Full Body' AND is_system = true
UNION ALL
SELECT id, 'Romanian Deadlift', 'legs', 3, 10, 5 FROM public.workout_templates WHERE name = 'Full Body' AND is_system = true
UNION ALL
SELECT id, 'Plank', 'abs', 3, 1, 6 FROM public.workout_templates WHERE name = 'Full Body' AND is_system = true;