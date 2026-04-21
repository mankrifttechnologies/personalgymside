-- =========================================================
-- 1. ORGANIZATION BRANDING (white-label)
-- =========================================================
CREATE TABLE public.organization_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  logo_url TEXT,
  cover_image_url TEXT,
  brand_color TEXT NOT NULL DEFAULT '#6366f1', -- hex; converted to HSL in app
  brand_color_dark TEXT,
  tagline TEXT,
  about TEXT,
  gallery_urls TEXT[] NOT NULL DEFAULT '{}',
  instagram_handle TEXT,
  facebook_url TEXT,
  whatsapp_number TEXT,
  google_maps_url TEXT,
  amenities TEXT[] NOT NULL DEFAULT '{}',
  trainer_highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  upi_vpa TEXT, -- gym's UPI ID for receiving payments
  upi_payee_name TEXT,
  gst_number TEXT,
  invoice_prefix TEXT NOT NULL DEFAULT 'INV',
  invoice_counter INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organization_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view branding (for landing pages)"
  ON public.organization_branding FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage their org branding"
  ON public.organization_branding FOR ALL
  USING (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid()));

CREATE POLICY "Super admins can manage all branding"
  ON public.organization_branding FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_org_branding_updated_at
  BEFORE UPDATE ON public.organization_branding
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 2. INVOICES (GST PDF)
-- =========================================================
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  member_id UUID NOT NULL,
  payment_record_id UUID, -- soft link; not enforced FK
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  plan_name TEXT NOT NULL,
  base_amount NUMERIC NOT NULL DEFAULT 0,
  cgst_rate NUMERIC NOT NULL DEFAULT 9,
  sgst_rate NUMERIC NOT NULL DEFAULT 9,
  cgst_amount NUMERIC NOT NULL DEFAULT 0,
  sgst_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_method TEXT,
  upi_vpa TEXT,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'issued', -- issued | paid | cancelled
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, invoice_number)
);

CREATE INDEX idx_invoices_org ON public.invoices(organization_id);
CREATE INDEX idx_invoices_member ON public.invoices(member_id);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their org invoices"
  ON public.invoices FOR ALL
  USING (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid()));

CREATE POLICY "Members can view their own invoices"
  ON public.invoices FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.gym_members gm WHERE gm.id = member_id AND gm.user_id = auth.uid()));

CREATE POLICY "Admins can manage invoices"
  ON public.invoices FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-generate invoice number (per-org sequential)
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  prefix TEXT;
  next_num INTEGER;
BEGIN
  IF NEW.invoice_number IS NOT NULL AND NEW.invoice_number <> '' THEN
    RETURN NEW;
  END IF;

  -- Atomically increment counter
  UPDATE public.organization_branding
    SET invoice_counter = invoice_counter + 1
    WHERE organization_id = NEW.organization_id
    RETURNING invoice_prefix, invoice_counter INTO prefix, next_num;

  -- If no branding row, create a minimal one
  IF NOT FOUND THEN
    INSERT INTO public.organization_branding (organization_id, invoice_counter)
      VALUES (NEW.organization_id, 1)
      RETURNING invoice_prefix, invoice_counter INTO prefix, next_num;
  END IF;

  NEW.invoice_number := prefix || '-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_number();

-- =========================================================
-- 3. DUNNING RULES (smart reminders)
-- =========================================================
CREATE TABLE public.dunning_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  days_offset INTEGER NOT NULL, -- negative = before due date, positive = after
  channels TEXT[] NOT NULL DEFAULT ARRAY['in_app'], -- in_app | whatsapp | sms | email
  message_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_suspend_after_days INTEGER, -- if set & overdue beyond this, suspend member
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dunning_rules_org ON public.dunning_rules(organization_id);

ALTER TABLE public.dunning_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own dunning rules"
  ON public.dunning_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid()));

CREATE POLICY "Admins manage all dunning"
  ON public.dunning_rules FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_dunning_rules_updated_at
  BEFORE UPDATE ON public.dunning_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 4. NOTIFICATION QUEUE (WhatsApp/SMS/in-app)
-- =========================================================
CREATE TABLE public.notification_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  recipient_user_id UUID,
  recipient_phone TEXT,
  recipient_name TEXT,
  channel TEXT NOT NULL, -- whatsapp | sms | in_app | email
  template_key TEXT, -- e.g. 'membership_expiry_reminder'
  message TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | sent | failed | cancelled
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_queue_org ON public.notification_queue(organization_id);
CREATE INDEX idx_notif_queue_status ON public.notification_queue(status, scheduled_for);

ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view their org queue"
  ON public.notification_queue FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid()));

CREATE POLICY "Owners manage their org queue"
  ON public.notification_queue FOR ALL
  USING (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid()));

CREATE POLICY "Recipients view their messages"
  ON public.notification_queue FOR SELECT
  USING (auth.uid() = recipient_user_id);

CREATE POLICY "Admins manage all notifications"
  ON public.notification_queue FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_notif_queue_updated_at
  BEFORE UPDATE ON public.notification_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 5. PROGRESS PHOTOS (AI comparison)
-- =========================================================
CREATE TABLE public.progress_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  photo_date DATE NOT NULL DEFAULT CURRENT_DATE,
  pose_type TEXT NOT NULL DEFAULT 'front', -- front | side | back
  weight_kg NUMERIC,
  notes TEXT,
  ai_analysis JSONB, -- cached AI commentary + estimated stats
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_progress_photos_user ON public.progress_photos(user_id, photo_date DESC);

ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own progress photos"
  ON public.progress_photos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- 6. GYM LANDING PLANS (public membership cards)
-- =========================================================
CREATE TABLE public.gym_landing_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  duration_label TEXT NOT NULL DEFAULT 'per month',
  features TEXT[] NOT NULL DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gym_landing_plans_org ON public.gym_landing_plans(organization_id, display_order);

ALTER TABLE public.gym_landing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active landing plans"
  ON public.gym_landing_plans FOR SELECT USING (is_active = true);

CREATE POLICY "Owners manage their landing plans"
  ON public.gym_landing_plans FOR ALL
  USING (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid()));

CREATE POLICY "Admins manage all landing plans"
  ON public.gym_landing_plans FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_gym_landing_plans_updated_at
  BEFORE UPDATE ON public.gym_landing_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 7. STORAGE BUCKETS
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
  VALUES ('gym-branding', 'gym-branding', true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('progress-photos', 'progress-photos', false)
  ON CONFLICT (id) DO NOTHING;

-- gym-branding: public read, owner-write
CREATE POLICY "Public can view gym branding files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gym-branding');

CREATE POLICY "Authenticated users can upload to gym branding"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'gym-branding' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can update their gym branding files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'gym-branding' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can delete their gym branding files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'gym-branding' AND auth.uid()::text = (storage.foldername(name))[1]);

-- progress-photos: strictly private to uploader
CREATE POLICY "Users view own progress photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own progress photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own progress photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);