CREATE OR REPLACE FUNCTION public.init_member_gamification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.points_wallet (member_id, balance, total_earned, total_spent)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.member_streaks (member_id, current_streak, longest_streak)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;
