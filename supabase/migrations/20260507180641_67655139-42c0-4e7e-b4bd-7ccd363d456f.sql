
CREATE POLICY "Owners can insert attendance for their members"
ON public.attendance_logs FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.gym_members gm
    JOIN public.organizations o ON o.id = gm.organization_id
    WHERE gm.id = attendance_logs.member_id AND o.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can update attendance for their members"
ON public.attendance_logs FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.gym_members gm
    JOIN public.organizations o ON o.id = gm.organization_id
    WHERE gm.id = attendance_logs.member_id AND o.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.gym_members gm
    JOIN public.organizations o ON o.id = gm.organization_id
    WHERE gm.id = attendance_logs.member_id AND o.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can view attendance for their members"
ON public.attendance_logs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.gym_members gm
    JOIN public.organizations o ON o.id = gm.organization_id
    WHERE gm.id = attendance_logs.member_id AND o.owner_id = auth.uid()
  )
);
