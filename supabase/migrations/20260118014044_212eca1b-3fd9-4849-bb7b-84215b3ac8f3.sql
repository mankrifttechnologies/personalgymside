-- Create support_tickets table for users to contact admin/staff
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support_responses table for admin/staff replies
CREATE TABLE public.support_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on support tables
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_responses ENABLE ROW LEVEL SECURITY;

-- Policies for support_tickets
CREATE POLICY "Users can view their own tickets"
ON public.support_tickets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and trainers can view all tickets"
ON public.support_tickets FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'trainer'));

CREATE POLICY "Admins and trainers can update tickets"
ON public.support_tickets FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'trainer'));

-- Policies for support_responses
CREATE POLICY "Users can view responses to their tickets"
ON public.support_responses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.support_tickets t
  WHERE t.id = support_responses.ticket_id AND t.user_id = auth.uid()
));

CREATE POLICY "Admins and trainers can view all responses"
ON public.support_responses FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'trainer'));

CREATE POLICY "Admins and trainers can add responses"
ON public.support_responses FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'trainer'));

-- Policy for admins to update profiles (approve users)
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for support tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_responses;