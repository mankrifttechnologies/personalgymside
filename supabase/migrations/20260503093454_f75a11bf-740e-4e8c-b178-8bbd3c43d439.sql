-- Add verification flag for self-registered members
ALTER TABLE public.gym_members
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;

-- Existing members are considered verified (back-compat)
UPDATE public.gym_members SET is_verified = true WHERE is_verified = false;

-- Allow gym owners to view members in their organization (for approval list)
DROP POLICY IF EXISTS "Owners can view their gym members" ON public.gym_members;
CREATE POLICY "Owners can view their gym members"
ON public.gym_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = gym_members.organization_id AND o.owner_id = auth.uid()
  )
);

-- Allow gym owners to update (approve/reject) members in their organization
DROP POLICY IF EXISTS "Owners can update their gym members" ON public.gym_members;
CREATE POLICY "Owners can update their gym members"
ON public.gym_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = gym_members.organization_id AND o.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = gym_members.organization_id AND o.owner_id = auth.uid()
  )
);

-- Allow gym owners to delete (reject) members in their organization
DROP POLICY IF EXISTS "Owners can delete their gym members" ON public.gym_members;
CREATE POLICY "Owners can delete their gym members"
ON public.gym_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = gym_members.organization_id AND o.owner_id = auth.uid()
  )
);