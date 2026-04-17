-- Marketplace listings table
CREATE TABLE public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  category TEXT NOT NULL DEFAULT 'other',
  condition TEXT NOT NULL DEFAULT 'new',
  brand TEXT,
  photos TEXT[] NOT NULL DEFAULT '{}',
  stock INTEGER NOT NULL DEFAULT 1,
  location TEXT,
  delivery_option TEXT NOT NULL DEFAULT 'pickup',
  status TEXT NOT NULL DEFAULT 'active',
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketplace_listings_seller ON public.marketplace_listings(seller_id);
CREATE INDEX idx_marketplace_listings_org ON public.marketplace_listings(organization_id);
CREATE INDEX idx_marketplace_listings_status ON public.marketplace_listings(status);
CREATE INDEX idx_marketplace_listings_category ON public.marketplace_listings(category);
CREATE INDEX idx_marketplace_listings_created ON public.marketplace_listings(created_at DESC);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active listings"
ON public.marketplace_listings FOR SELECT
TO authenticated
USING (status = 'active' OR auth.uid() = seller_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create their own listings"
ON public.marketplace_listings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own listings"
ON public.marketplace_listings FOR UPDATE
TO authenticated
USING (auth.uid() = seller_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers can delete their own listings"
ON public.marketplace_listings FOR DELETE
TO authenticated
USING (auth.uid() = seller_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_marketplace_listings_updated_at
BEFORE UPDATE ON public.marketplace_listings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for product photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace-photos', 'marketplace-photos', true);

CREATE POLICY "Marketplace photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketplace-photos');

CREATE POLICY "Users can upload their own marketplace photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'marketplace-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own marketplace photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'marketplace-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own marketplace photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'marketplace-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);