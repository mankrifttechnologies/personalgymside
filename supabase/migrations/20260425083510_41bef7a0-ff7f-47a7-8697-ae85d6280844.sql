-- Allow org owners to manage files in gym-branding bucket under their org folder
CREATE POLICY "Owners can upload gym branding"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'gym-branding'
  AND EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id::text = (storage.foldername(name))[1]
      AND o.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can update gym branding"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'gym-branding'
  AND EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id::text = (storage.foldername(name))[1]
      AND o.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete gym branding"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'gym-branding'
  AND EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id::text = (storage.foldername(name))[1]
      AND o.owner_id = auth.uid()
  )
);

CREATE POLICY "Public can view gym branding"
ON storage.objects FOR SELECT
USING (bucket_id = 'gym-branding');

CREATE POLICY "Admins manage gym branding"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'gym-branding' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'gym-branding' AND has_role(auth.uid(), 'admin'::app_role));