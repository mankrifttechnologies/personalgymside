
CREATE TABLE public.daily_qr_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code text NOT NULL,
  valid_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, valid_date),
  UNIQUE(code)
);

ALTER TABLE public.daily_qr_codes ENABLE ROW LEVEL SECURITY;

-- Owners can create QR codes for their org
CREATE POLICY "Owners can create daily QR codes"
ON public.daily_qr_codes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = daily_qr_codes.organization_id
    AND o.owner_id = auth.uid()
  )
);

-- Owners can view their org's QR codes
CREATE POLICY "Owners can view their org QR codes"
ON public.daily_qr_codes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = daily_qr_codes.organization_id
    AND o.owner_id = auth.uid()
  )
);

-- Members can read QR codes to validate scans
CREATE POLICY "Members can read QR codes for validation"
ON public.daily_qr_codes
FOR SELECT
TO authenticated
USING (valid_date = CURRENT_DATE);

-- Admins can manage all
CREATE POLICY "Admins can manage all QR codes"
ON public.daily_qr_codes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
