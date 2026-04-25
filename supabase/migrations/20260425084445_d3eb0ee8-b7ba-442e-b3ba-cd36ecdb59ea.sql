CREATE POLICY "Anyone can view active organizations"
ON public.organizations FOR SELECT
TO anon, authenticated
USING (status = 'active');