CREATE POLICY "Owners can manage their own announcements"
ON public.gym_announcements
FOR ALL
TO authenticated
USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.organizations o WHERE o.owner_id = auth.uid()))
WITH CHECK (created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.organizations o WHERE o.owner_id = auth.uid()));