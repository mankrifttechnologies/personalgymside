-- Drop the existing policy
DROP POLICY IF EXISTS "Friends can view friend profiles" ON public.profiles;

-- Create updated policy that allows viewing profiles for pending requests too
CREATE POLICY "Friends can view friend profiles" ON public.profiles
FOR SELECT USING (
  auth.uid() = user_id 
  OR is_public = true 
  OR EXISTS (
    SELECT 1 FROM friendships f
    WHERE (
      (f.user_id = auth.uid() AND f.friend_id = profiles.user_id)
      OR (f.friend_id = auth.uid() AND f.user_id = profiles.user_id)
    )
  )
);