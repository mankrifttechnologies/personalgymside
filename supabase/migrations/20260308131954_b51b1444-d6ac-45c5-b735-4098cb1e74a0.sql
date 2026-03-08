
-- Allow authenticated users to count bookings for any class (needed for capacity display)
CREATE POLICY "Authenticated users can count bookings" ON public.class_bookings FOR SELECT TO authenticated USING (true);
