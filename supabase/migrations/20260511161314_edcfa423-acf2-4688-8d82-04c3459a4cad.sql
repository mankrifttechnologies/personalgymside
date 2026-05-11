-- 1. Add pending_gym_name to gym_members for users whose gym isn't on the platform yet
ALTER TABLE public.gym_members
  ADD COLUMN IF NOT EXISTS pending_gym_name text;

CREATE INDEX IF NOT EXISTS idx_gym_members_pending_gym_name
  ON public.gym_members (lower(pending_gym_name))
  WHERE pending_gym_name IS NOT NULL;

-- 2. Search organizations by name (case-insensitive, partial match) - SECURITY DEFINER so
-- unauthenticated users registering can find their gym without exposing the full org table.
CREATE OR REPLACE FUNCTION public.search_organizations_by_name(query text)
RETURNS TABLE(id uuid, name text, gym_code text)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  IF query IS NULL OR length(trim(query)) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT o.id, o.name, o.gym_code
  FROM public.organizations o
  WHERE o.status = 'active'
    AND o.name ILIKE '%' || trim(query) || '%'
  ORDER BY
    -- exact matches first, then prefix, then substring
    CASE
      WHEN lower(o.name) = lower(trim(query)) THEN 0
      WHEN lower(o.name) LIKE lower(trim(query)) || '%' THEN 1
      ELSE 2
    END,
    o.name
  LIMIT 10;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_organizations_by_name(text) TO anon, authenticated;
