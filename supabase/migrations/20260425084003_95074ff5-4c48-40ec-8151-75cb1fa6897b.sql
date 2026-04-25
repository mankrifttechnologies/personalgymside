DROP POLICY IF EXISTS "Owners can upload gym branding" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update gym branding" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete gym branding" ON storage.objects;

CREATE POLICY "Owners can upload gym branding"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'gym-branding'
  AND EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id::text = (storage.foldername(storage.objects.name))[1]
      AND o.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can update gym branding"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'gym-branding'
  AND EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id::text = (storage.foldername(storage.objects.name))[1]
      AND o.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete gym branding"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'gym-branding'
  AND EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id::text = (storage.foldername(storage.objects.name))[1]
      AND o.owner_id = auth.uid()
  )
);