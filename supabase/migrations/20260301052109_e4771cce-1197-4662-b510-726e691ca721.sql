
-- Fix overly permissive "System can manage" policies
-- These currently allow ANY user to write data via USING(true)
-- Replace with admin-only policies for write operations

-- 1. member_streaks: Remove dangerous ALL policy, keep SELECT policies
DROP POLICY IF EXISTS "System can manage streaks" ON public.member_streaks;
CREATE POLICY "Admins can manage streaks"
  ON public.member_streaks
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. member_rankings: Remove dangerous ALL policy, keep SELECT policy
DROP POLICY IF EXISTS "System can manage rankings" ON public.member_rankings;
CREATE POLICY "Admins can manage rankings"
  ON public.member_rankings
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. member_badges: Remove dangerous ALL policy, keep SELECT policy
DROP POLICY IF EXISTS "System can manage badges" ON public.member_badges;
CREATE POLICY "Admins can manage badges"
  ON public.member_badges
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. points_wallet: Remove dangerous ALL policy, keep SELECT policies
DROP POLICY IF EXISTS "System can manage wallets" ON public.points_wallet;
CREATE POLICY "Admins can manage wallets"
  ON public.points_wallet
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. points_transactions: Remove dangerous ALL policy, keep SELECT policies
DROP POLICY IF EXISTS "System can manage transactions" ON public.points_transactions;
CREATE POLICY "Admins can manage transactions"
  ON public.points_transactions
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 6. attendance_logs: Replace open INSERT with admin-only INSERT
DROP POLICY IF EXISTS "System can insert attendance" ON public.attendance_logs;
CREATE POLICY "Admins can insert attendance"
  ON public.attendance_logs
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
