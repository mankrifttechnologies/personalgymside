-- Allow members to insert their own attendance logs (for QR self check-in)
CREATE POLICY "Members can insert their own attendance"
ON public.attendance_logs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.gym_members gm
    WHERE gm.id = attendance_logs.member_id
      AND gm.user_id = auth.uid()
  )
);

-- Allow members to update their own attendance logs (for QR self check-out)
CREATE POLICY "Members can update their own attendance"
ON public.attendance_logs
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.gym_members gm
    WHERE gm.id = attendance_logs.member_id
      AND gm.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.gym_members gm
    WHERE gm.id = attendance_logs.member_id
      AND gm.user_id = auth.uid()
  )
);