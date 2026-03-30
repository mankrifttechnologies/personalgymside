-- Equipment/maintenance tracking for gym owners
CREATE TABLE public.equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'cardio',
  status text NOT NULL DEFAULT 'operational',
  location text,
  purchase_date date,
  last_maintenance_date date,
  next_maintenance_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage equipment"
ON public.equipment FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone authenticated can view equipment"
ON public.equipment FOR SELECT TO authenticated
USING (true);