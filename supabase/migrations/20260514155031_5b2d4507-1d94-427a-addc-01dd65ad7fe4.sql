-- 1. Add organization_id to gym_announcements
ALTER TABLE public.gym_announcements
  ADD COLUMN IF NOT EXISTS organization_id uuid;

CREATE INDEX IF NOT EXISTS idx_gym_announcements_org
  ON public.gym_announcements(organization_id);

-- 2. Backfill organization_id from creator's owned organization where possible
UPDATE public.gym_announcements ga
SET organization_id = o.id
FROM public.organizations o
WHERE ga.organization_id IS NULL
  AND o.owner_id = ga.created_by;

-- 3. Default expires_at to now()+1day when null on insert
CREATE OR REPLACE FUNCTION public.set_announcement_default_expiry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := now() + interval '1 day';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_announcement_default_expiry ON public.gym_announcements;
CREATE TRIGGER trg_announcement_default_expiry
  BEFORE INSERT ON public.gym_announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_announcement_default_expiry();

-- 4. Replace overly-broad SELECT policy with org-scoped one
DROP POLICY IF EXISTS "Anyone authenticated can view active announcements" ON public.gym_announcements;

CREATE POLICY "Members view their gym's active announcements"
ON public.gym_announcements
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (expires_at IS NULL OR expires_at > now())
  AND (
    -- Member of the same org
    EXISTS (
      SELECT 1 FROM public.gym_members gm
      WHERE gm.user_id = auth.uid()
        AND gm.organization_id = gym_announcements.organization_id
    )
    -- OR owner of the org
    OR EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = gym_announcements.organization_id
        AND o.owner_id = auth.uid()
    )
    -- OR admin
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);