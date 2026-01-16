-- Add is_approved column to profiles for admin approval (feed access)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;

-- Create user_photos table for storing user uploaded photos
CREATE TABLE public.user_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_photos
ALTER TABLE public.user_photos ENABLE ROW LEVEL SECURITY;

-- Users can view their own photos
CREATE POLICY "Users can view their own photos" 
ON public.user_photos 
FOR SELECT 
USING (auth.uid() = user_id);

-- Approved users can view all photos (for feed)
CREATE POLICY "Approved users can view all photos" 
ON public.user_photos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_approved = true
  )
);

-- Users can insert their own photos
CREATE POLICY "Users can insert their own photos" 
ON public.user_photos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own photos
CREATE POLICY "Users can delete their own photos" 
ON public.user_photos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime for user_photos
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_photos;