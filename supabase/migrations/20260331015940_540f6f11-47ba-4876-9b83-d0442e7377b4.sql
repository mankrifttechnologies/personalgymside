
-- Leads table for tracking potential members
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  source text NOT NULL DEFAULT 'walk_in',
  status text NOT NULL DEFAULT 'new',
  interested_plan_id uuid REFERENCES public.membership_plans(id),
  notes text,
  follow_up_date date,
  assigned_to uuid,
  converted_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and trainers can manage leads" ON public.leads
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'trainer'::app_role));

-- Campaigns / Promotional Offers
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  campaign_type text NOT NULL DEFAULT 'discount',
  discount_percentage numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  applicable_plan_id uuid REFERENCES public.membership_plans(id),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  promo_code text,
  max_redemptions integer,
  current_redemptions integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaigns" ON public.campaigns
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone authenticated can view active campaigns" ON public.campaigns
  FOR SELECT TO authenticated
  USING (is_active = true);
