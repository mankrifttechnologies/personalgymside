-- Drop the restrictive SELECT policy and create a new one that allows member discovery
-- The current policy only allows viewing profiles of friends or public profiles
-- This blocks the search/follow feature from working properly

-- First, drop the existing SELECT policy
DROP POLICY IF EXISTS "Friends can view friend profiles" ON public.profiles;

-- Create a new policy that allows all authenticated users to view basic profile info
-- This is needed for the member search and follow features to work
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Note: Sensitive data should be handled at the application level if needed
-- The is_public flag can still be used to control what data is displayed in the UI