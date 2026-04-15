
-- Add gym_code to organizations for member self-registration
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS gym_code TEXT UNIQUE;

-- Generate gym codes for existing orgs
UPDATE public.organizations SET gym_code = UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6)) WHERE gym_code IS NULL;

-- Create function to auto-generate gym_code on insert
CREATE OR REPLACE FUNCTION public.generate_gym_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.gym_code IS NULL THEN
    NEW.gym_code := UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_generate_gym_code
  BEFORE INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_gym_code();

-- Allow any authenticated user to look up org by gym_code (for joining)
CREATE OR REPLACE FUNCTION public.get_org_by_gym_code(code TEXT)
RETURNS TABLE(id UUID, name TEXT, gym_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.name, o.gym_code
  FROM public.organizations o
  WHERE UPPER(o.gym_code) = UPPER(code)
  AND o.status = 'active';
END;
$$;
