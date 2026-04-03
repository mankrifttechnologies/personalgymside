CREATE TABLE public.announcement_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES public.gym_announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reads"
ON public.announcement_reads
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark announcements as read"
ON public.announcement_reads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all reads"
ON public.announcement_reads
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_announcement_reads_user ON public.announcement_reads(user_id);
CREATE INDEX idx_announcement_reads_announcement ON public.announcement_reads(announcement_id);