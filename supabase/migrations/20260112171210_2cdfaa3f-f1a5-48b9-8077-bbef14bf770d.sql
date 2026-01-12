
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'trainer', 'member');

-- Create enum for attendance status
CREATE TYPE public.attendance_status AS ENUM ('checked_in', 'checked_out', 'auto_checkout', 'missed');

-- Create enum for member status
CREATE TYPE public.member_status AS ENUM ('active', 'inactive', 'suspended', 'banned');

-- Create enum for reward status
CREATE TYPE public.reward_redemption_status AS ENUM ('pending', 'approved', 'rejected', 'fulfilled');

-- User roles table (for RBAC)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Gym members table (extends profile concept)
CREATE TABLE public.gym_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  member_code TEXT NOT NULL UNIQUE,
  status member_status NOT NULL DEFAULT 'active',
  batch TEXT,
  trainer_id UUID,
  joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Biometric devices table (for future integration)
CREATE TABLE public.biometric_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_sync TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attendance logs table
CREATE TABLE public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.gym_members(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ NOT NULL,
  check_out_time TIMESTAMPTZ,
  device_id TEXT,
  status attendance_status NOT NULL DEFAULT 'checked_in',
  duration_minutes INTEGER,
  is_on_time BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Member streaks table
CREATE TABLE public.member_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.gym_members(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_attendance_date DATE,
  streak_start_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Member rankings table (computed daily)
CREATE TABLE public.member_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.gym_members(id) ON DELETE CASCADE,
  rank_date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_rank INTEGER,
  weekly_rank INTEGER,
  monthly_rank INTEGER,
  all_time_rank INTEGER,
  total_attendance_days INTEGER NOT NULL DEFAULT 0,
  consistency_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  on_time_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (member_id, rank_date)
);

-- Points wallet table
CREATE TABLE public.points_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.gym_members(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Points transactions table
CREATE TABLE public.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.points_wallet(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rewards catalog table
CREATE TABLE public.rewards_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  stock INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reward redemptions table
CREATE TABLE public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.gym_members(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards_catalog(id),
  points_spent INTEGER NOT NULL,
  status reward_redemption_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  fulfilled_at TIMESTAMPTZ
);

-- Member badges table
CREATE TABLE public.member_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.gym_members(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  UNIQUE (member_id, badge_type)
);

-- Create indexes for performance
CREATE INDEX idx_attendance_logs_member_id ON public.attendance_logs(member_id);
CREATE INDEX idx_attendance_logs_check_in_time ON public.attendance_logs(check_in_time);
CREATE INDEX idx_attendance_logs_status ON public.attendance_logs(status);
CREATE INDEX idx_member_rankings_date ON public.member_rankings(rank_date);
CREATE INDEX idx_points_transactions_wallet ON public.points_transactions(wallet_id);
CREATE INDEX idx_gym_members_user_id ON public.gym_members(user_id);
CREATE INDEX idx_gym_members_member_code ON public.gym_members(member_code);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for gym_members
CREATE POLICY "Members can view their own record" ON public.gym_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and trainers can view all members" ON public.gym_members
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'trainer')
  );

CREATE POLICY "Admins can manage members" ON public.gym_members
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own member record" ON public.gym_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for biometric_devices
CREATE POLICY "Anyone can view active devices" ON public.biometric_devices
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage devices" ON public.biometric_devices
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for attendance_logs
CREATE POLICY "Members can view their own attendance" ON public.attendance_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gym_members gm 
      WHERE gm.id = attendance_logs.member_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and trainers can view all attendance" ON public.attendance_logs
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'trainer')
  );

CREATE POLICY "Admins can manage attendance" ON public.attendance_logs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert attendance" ON public.attendance_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for member_streaks
CREATE POLICY "Members can view their own streaks" ON public.member_streaks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gym_members gm 
      WHERE gm.id = member_streaks.member_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view streaks for leaderboard" ON public.member_streaks
  FOR SELECT USING (true);

CREATE POLICY "System can manage streaks" ON public.member_streaks
  FOR ALL USING (true);

-- RLS Policies for member_rankings
CREATE POLICY "Anyone can view rankings" ON public.member_rankings
  FOR SELECT USING (true);

CREATE POLICY "System can manage rankings" ON public.member_rankings
  FOR ALL USING (true);

-- RLS Policies for points_wallet
CREATE POLICY "Members can view their own wallet" ON public.points_wallet
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gym_members gm 
      WHERE gm.id = points_wallet.member_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all wallets" ON public.points_wallet
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage wallets" ON public.points_wallet
  FOR ALL USING (true);

-- RLS Policies for points_transactions
CREATE POLICY "Members can view their own transactions" ON public.points_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.points_wallet pw
      JOIN public.gym_members gm ON gm.id = pw.member_id
      WHERE pw.id = points_transactions.wallet_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all transactions" ON public.points_transactions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage transactions" ON public.points_transactions
  FOR ALL USING (true);

-- RLS Policies for rewards_catalog
CREATE POLICY "Anyone can view active rewards" ON public.rewards_catalog
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage rewards" ON public.rewards_catalog
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for reward_redemptions
CREATE POLICY "Members can view their own redemptions" ON public.reward_redemptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gym_members gm 
      WHERE gm.id = reward_redemptions.member_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can redeem rewards" ON public.reward_redemptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gym_members gm 
      WHERE gm.id = reward_redemptions.member_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage redemptions" ON public.reward_redemptions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for member_badges
CREATE POLICY "Anyone can view badges" ON public.member_badges
  FOR SELECT USING (true);

CREATE POLICY "System can manage badges" ON public.member_badges
  FOR ALL USING (true);

-- Function to auto-generate member code
CREATE OR REPLACE FUNCTION public.generate_member_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.member_code IS NULL THEN
    NEW.member_code := 'FIT' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_generate_member_code
  BEFORE INSERT ON public.gym_members
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_member_code();

-- Function to create wallet and streak on member creation
CREATE OR REPLACE FUNCTION public.init_member_gamification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create points wallet
  INSERT INTO public.points_wallet (member_id, balance, total_earned, total_spent)
  VALUES (NEW.id, 0, 0, 0);
  
  -- Create streak record
  INSERT INTO public.member_streaks (member_id, current_streak, longest_streak)
  VALUES (NEW.id, 0, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_init_member_gamification
  AFTER INSERT ON public.gym_members
  FOR EACH ROW
  EXECUTE FUNCTION public.init_member_gamification();

-- Insert demo biometric device
INSERT INTO public.biometric_devices (device_id, name, location, status)
VALUES ('BIO-01', 'Main Entrance Scanner', 'Front Desk', 'active');

-- Insert demo rewards
INSERT INTO public.rewards_catalog (name, description, points_cost, category, is_active) VALUES
('Free PT Session', 'One free personal training session with any trainer', 500, 'Training', true),
('Custom Diet Plan', 'Personalized diet plan from our nutritionist', 300, 'Nutrition', true),
('Gym T-Shirt', 'Branded gym merchandise t-shirt', 200, 'Merchandise', true),
('Protein Shake', 'Free protein shake from the gym cafe', 50, 'Refreshments', true),
('1 Month Extension', 'Extend your membership by 1 month', 1000, 'Membership', true),
('Locker Upgrade', 'Upgrade to premium locker for 1 month', 150, 'Facilities', true);

-- Add trigger to update timestamps
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gym_members_updated_at
  BEFORE UPDATE ON public.gym_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_biometric_devices_updated_at
  BEFORE UPDATE ON public.biometric_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_logs_updated_at
  BEFORE UPDATE ON public.attendance_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rewards_catalog_updated_at
  BEFORE UPDATE ON public.rewards_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
