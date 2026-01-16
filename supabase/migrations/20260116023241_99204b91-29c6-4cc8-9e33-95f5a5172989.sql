-- Create photo_likes table
CREATE TABLE public.photo_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES public.user_photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

-- Create photo_comments table
CREATE TABLE public.photo_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES public.user_photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;

-- Photo likes policies
CREATE POLICY "Users can view all likes" 
ON public.photo_likes FOR SELECT USING (true);

CREATE POLICY "Users can like photos" 
ON public.photo_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" 
ON public.photo_likes FOR DELETE 
USING (auth.uid() = user_id);

-- Photo comments policies
CREATE POLICY "Users can view all comments" 
ON public.photo_comments FOR SELECT USING (true);

CREATE POLICY "Users can add comments" 
ON public.photo_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.photo_comments FOR DELETE 
USING (auth.uid() = user_id);

-- Create photos storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for photos bucket
CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for feed updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.photo_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.photo_comments;