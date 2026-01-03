-- Create a security definer function to lookup user_id by friend code
-- This bypasses RLS to allow finding users by their friend code
CREATE OR REPLACE FUNCTION public.get_user_id_by_friend_code(code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_user_id UUID;
BEGIN
  SELECT user_id INTO found_user_id
  FROM profiles
  WHERE friend_code = UPPER(code);
  
  RETURN found_user_id;
END;
$$;