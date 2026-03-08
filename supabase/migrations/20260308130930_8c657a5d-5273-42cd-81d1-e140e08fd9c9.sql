
-- Gym Classes / Sessions for Booking
CREATE TABLE public.gym_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  class_type TEXT NOT NULL DEFAULT 'group',
  instructor_name TEXT,
  instructor_id UUID,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 20,
  location TEXT DEFAULT 'Main Hall',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Class Bookings
CREATE TABLE public.class_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.gym_classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  booking_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, user_id, booking_date)
);

-- Workout Duels
CREATE TABLE public.workout_duels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID NOT NULL,
  opponent_id UUID NOT NULL,
  duel_type TEXT NOT NULL DEFAULT 'volume',
  target_value INTEGER NOT NULL DEFAULT 0,
  challenger_score NUMERIC NOT NULL DEFAULT 0,
  opponent_score NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  winner_id UUID,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ephemeral Stories (24h)
CREATE TABLE public.gym_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  story_type TEXT NOT NULL DEFAULT 'checkin',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Story Views
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.gym_stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Mobility Routines (pre-defined)
CREATE TABLE public.mobility_routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  routine_type TEXT NOT NULL DEFAULT 'warmup',
  target_area TEXT NOT NULL DEFAULT 'full_body',
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT true,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.gym_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobility_routines ENABLE ROW LEVEL SECURITY;

-- gym_classes policies
CREATE POLICY "Anyone can view active classes" ON public.gym_classes FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage classes" ON public.gym_classes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- class_bookings policies
CREATE POLICY "Users can book classes" ON public.class_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their bookings" ON public.class_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can cancel their bookings" ON public.class_bookings FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all bookings" ON public.class_bookings FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- workout_duels policies
CREATE POLICY "Users can create duels" ON public.workout_duels FOR INSERT WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "Users can view their duels" ON public.workout_duels FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);
CREATE POLICY "Users can update their duels" ON public.workout_duels FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- gym_stories policies
CREATE POLICY "Users can create stories" ON public.gym_stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view non-expired stories" ON public.gym_stories FOR SELECT USING (expires_at > now());
CREATE POLICY "Users can delete their stories" ON public.gym_stories FOR DELETE USING (auth.uid() = user_id);

-- story_views policies
CREATE POLICY "Users can mark stories viewed" ON public.story_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);
CREATE POLICY "Story owners can see views" ON public.story_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.gym_stories s WHERE s.id = story_views.story_id AND s.user_id = auth.uid())
);

-- mobility_routines policies
CREATE POLICY "Anyone can view system routines" ON public.mobility_routines FOR SELECT USING (is_system = true OR auth.uid() = user_id);
CREATE POLICY "Admins can manage routines" ON public.mobility_routines FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for stories and duels
ALTER PUBLICATION supabase_realtime ADD TABLE public.gym_stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_duels;
