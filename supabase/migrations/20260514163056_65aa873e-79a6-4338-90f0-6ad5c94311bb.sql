
-- 1. UPI fields on payment_records
ALTER TABLE public.payment_records
  ADD COLUMN IF NOT EXISTS upi_vpa text,
  ADD COLUMN IF NOT EXISTS upi_link text,
  ADD COLUMN IF NOT EXISTS upi_qr_url text;

-- 2. UPI + GST fields on organization_branding
ALTER TABLE public.organization_branding
  ADD COLUMN IF NOT EXISTS upi_vpa text,
  ADD COLUMN IF NOT EXISTS gstin text,
  ADD COLUMN IF NOT EXISTS pan text,
  ADD COLUMN IF NOT EXISTS business_address text,
  ADD COLUMN IF NOT EXISTS state_code text;

-- 3. Phone on profiles (for WhatsApp re-engagement)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text;

-- 4. Trials table
CREATE TABLE IF NOT EXISTS public.trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  member_id uuid,
  lead_id uuid,
  prospect_name text NOT NULL,
  prospect_phone text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active', -- active, converted, lost
  plan_id uuid,
  notes text,
  converted_at timestamptz,
  converted_payment_id uuid,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their org trials"
ON public.trials FOR ALL
USING (EXISTS (SELECT 1 FROM organizations o WHERE o.id = trials.organization_id AND o.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM organizations o WHERE o.id = trials.organization_id AND o.owner_id = auth.uid()));

CREATE POLICY "Admins manage all trials"
ON public.trials FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trials_updated_at
BEFORE UPDATE ON public.trials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_trials_org_status ON public.trials(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_trials_end_date ON public.trials(end_date);

-- 5. Re-engagement templates
CREATE TABLE IF NOT EXISTS public.reengagement_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  inactivity_days integer NOT NULL DEFAULT 7,
  channel text NOT NULL DEFAULT 'whatsapp',
  message_template text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reengagement_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their reengagement templates"
ON public.reengagement_templates FOR ALL
USING (EXISTS (SELECT 1 FROM organizations o WHERE o.id = reengagement_templates.organization_id AND o.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM organizations o WHERE o.id = reengagement_templates.organization_id AND o.owner_id = auth.uid()));

CREATE POLICY "Admins manage all reengagement templates"
ON public.reengagement_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER reengagement_templates_updated_at
BEFORE UPDATE ON public.reengagement_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Re-engagement contact log (so owners can mark members as contacted)
CREATE TABLE IF NOT EXISTS public.reengagement_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  member_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'whatsapp',
  message text,
  contacted_by uuid NOT NULL,
  contacted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reengagement_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their reengagement contacts"
ON public.reengagement_contacts FOR ALL
USING (EXISTS (SELECT 1 FROM organizations o WHERE o.id = reengagement_contacts.organization_id AND o.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM organizations o WHERE o.id = reengagement_contacts.organization_id AND o.owner_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_reengagement_contacts_member ON public.reengagement_contacts(member_id, contacted_at DESC);
