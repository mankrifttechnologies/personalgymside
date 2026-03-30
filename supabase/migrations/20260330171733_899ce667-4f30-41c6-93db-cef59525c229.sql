
-- Gym announcements table
CREATE TABLE public.gym_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  announcement_type TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority TEXT NOT NULL DEFAULT 'normal',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE public.gym_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active announcements"
  ON public.gym_announcements FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage announcements"
  ON public.gym_announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- PT sessions table
CREATE TABLE public.pt_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL,
  member_id UUID,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pt_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view available sessions"
  ON public.pt_sessions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Trainers can manage own sessions"
  ON public.pt_sessions FOR ALL TO authenticated
  USING (trainer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members can book sessions"
  ON public.pt_sessions FOR UPDATE TO authenticated
  USING (status = 'available')
  WITH CHECK (member_id = auth.uid());

-- Referral tracking
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reward_points INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON public.referrals FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE POLICY "Admins can manage referrals"
  ON public.referrals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.gym_announcements;
