
-- Group challenges tables
CREATE TABLE public.group_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL DEFAULT 'volume',
  target_value INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  xp_reward INTEGER NOT NULL DEFAULT 200,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.challenge_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.group_challenges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  total_score NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.challenge_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.challenge_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  contribution NUMERIC NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- RLS
ALTER TABLE public.group_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_team_members ENABLE ROW LEVEL SECURITY;

-- Group challenges policies
CREATE POLICY "Anyone can view active group challenges" ON public.group_challenges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage group challenges" ON public.group_challenges
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Challenge teams policies
CREATE POLICY "Anyone can view challenge teams" ON public.challenge_teams
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage challenge teams" ON public.challenge_teams
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Team members policies
CREATE POLICY "Anyone can view team members" ON public.challenge_team_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join teams" ON public.challenge_team_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave teams" ON public.challenge_team_members
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own contribution" ON public.challenge_team_members
  FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for group challenges
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_team_members;
