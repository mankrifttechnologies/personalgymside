
-- Create feedback forms table
CREATE TABLE public.feedback_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage feedback forms"
  ON public.feedback_forms FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone authenticated can view active forms"
  ON public.feedback_forms FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create feedback responses table
CREATE TABLE public.feedback_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.feedback_forms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all responses"
  ON public.feedback_responses FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can submit responses"
  ON public.feedback_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own responses"
  ON public.feedback_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add updated_at trigger for feedback_forms
CREATE TRIGGER update_feedback_forms_updated_at
  BEFORE UPDATE ON public.feedback_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
