-- Create follows table for tracking member progress without friendship
CREATE TABLE public.member_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE public.member_follows ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own follows"
ON public.member_follows
FOR SELECT
USING (auth.uid() = follower_id);

CREATE POLICY "Users can see who follows them"
ON public.member_follows
FOR SELECT
USING (auth.uid() = following_id);

CREATE POLICY "Users can follow others"
ON public.member_follows
FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.member_follows
FOR DELETE
USING (auth.uid() = follower_id);

-- Enable realtime for follows
ALTER PUBLICATION supabase_realtime ADD TABLE public.member_follows;