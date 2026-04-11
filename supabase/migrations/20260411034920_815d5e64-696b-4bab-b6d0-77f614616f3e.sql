
-- Add 'owner' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  owner_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view organizations"
  ON public.organizations FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Owners can update their own organization"
  ON public.organizations FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Super admins can manage all organizations"
  ON public.organizations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create organization_members table
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own org membership"
  ON public.organization_members FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Org owners can view all members in their org"
  ON public.organization_members FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = organization_members.organization_id
    AND o.owner_id = auth.uid()
  ));

CREATE POLICY "Org owners can add members to their org"
  ON public.organization_members FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = organization_members.organization_id
    AND o.owner_id = auth.uid()
  ));

CREATE POLICY "Org owners can update members in their org"
  ON public.organization_members FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = organization_members.organization_id
    AND o.owner_id = auth.uid()
  ));

CREATE POLICY "Org owners can remove members from their org"
  ON public.organization_members FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = organization_members.organization_id
    AND o.owner_id = auth.uid()
  ));

CREATE POLICY "Super admins can manage all org members"
  ON public.organization_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add organization_id to gym_members
ALTER TABLE public.gym_members ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Add updated_at trigger for organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
