-- Add qr_type column with default 'checkin' for backward compatibility
ALTER TABLE public.daily_qr_codes
  ADD COLUMN IF NOT EXISTS qr_type text NOT NULL DEFAULT 'checkin';

-- Drop the old unique constraint on (organization_id, valid_date) if present,
-- so we can have one check-in and one check-out QR per day.
DO $$
DECLARE
  c_name text;
BEGIN
  SELECT conname INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'public.daily_qr_codes'::regclass
    AND contype = 'u'
    AND pg_get_constraintdef(oid) ILIKE '%(organization_id, valid_date)%'
  LIMIT 1;
  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.daily_qr_codes DROP CONSTRAINT %I', c_name);
  END IF;
END $$;

-- New unique constraint: one QR per (org, date, type)
ALTER TABLE public.daily_qr_codes
  DROP CONSTRAINT IF EXISTS daily_qr_codes_org_date_type_unique;
ALTER TABLE public.daily_qr_codes
  ADD CONSTRAINT daily_qr_codes_org_date_type_unique
  UNIQUE (organization_id, valid_date, qr_type);

-- Validate qr_type values
ALTER TABLE public.daily_qr_codes
  DROP CONSTRAINT IF EXISTS daily_qr_codes_qr_type_check;
ALTER TABLE public.daily_qr_codes
  ADD CONSTRAINT daily_qr_codes_qr_type_check
  CHECK (qr_type IN ('checkin', 'checkout'));