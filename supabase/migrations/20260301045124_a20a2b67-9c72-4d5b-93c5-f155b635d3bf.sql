
-- Update handle_new_user to set name from email prefix
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

-- Backfill existing profiles with null names
UPDATE public.profiles
SET name = split_part(u.email, '@', 1)
FROM auth.users u
WHERE profiles.user_id = u.id
AND (profiles.name IS NULL OR profiles.name = '');
