import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useIsAdmin, useIsTrainer } from './useUserRole';
import { toast } from 'sonner';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
  responses?: SupportResponse[];
}

export interface SupportResponse {
  id: string;
  ticket_id: string;
  responder_id: string;
  message: string;
  created_at: string;
  responder_name?: string;
}

// For regular users to see their tickets
export function useMyTickets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-tickets', user?.id],
    queryFn: async (): Promise<SupportTicket[]> => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get responses for each ticket
      const ticketIds = data?.map(t => t.id) || [];
      const { data: responses } = await supabase
        .from('support_responses')
        .select('*')
        .in('ticket_id', ticketIds)
        .order('created_at', { ascending: true });

      // Get responder names
      const responderIds = [...new Set(responses?.map(r => r.responder_id) || [])];
      const { data: responderProfiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', responderIds);

      const responderMap = new Map(responderProfiles?.map(p => [p.user_id, p.name]) || []);

      return (data || []).map(ticket => ({
        ...ticket,
        responses: responses?.filter(r => r.ticket_id === ticket.id).map(r => ({
          ...r,
          responder_name: responderMap.get(r.responder_id) || 'Staff'
        })) || []
      }));
    },
    enabled: !!user?.id
  });
}

// For admin/staff to see all tickets
export function useAllTickets() {
  const { isAdmin } = useIsAdmin();
  const { isTrainer } = useIsTrainer();

  return useQuery({
    queryKey: ['all-tickets'],
    queryFn: async (): Promise<SupportTicket[]> => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user names
      const userIds = [...new Set(data?.map(t => t.user_id) || [])];
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);

      const userMap = new Map(userProfiles?.map(p => [p.user_id, p.name]) || []);

      // Get responses for each ticket
      const ticketIds = data?.map(t => t.id) || [];
      const { data: responses } = await supabase
        .from('support_responses')
        .select('*')
        .in('ticket_id', ticketIds)
        .order('created_at', { ascending: true });

      const responderIds = [...new Set(responses?.map(r => r.responder_id) || [])];
      const { data: responderProfiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', responderIds);

      const responderMap = new Map(responderProfiles?.map(p => [p.user_id, p.name]) || []);

      return (data || []).map(ticket => ({
        ...ticket,
        user_name: userMap.get(ticket.user_id) || 'Unknown User',
        responses: responses?.filter(r => r.ticket_id === ticket.id).map(r => ({
          ...r,
          responder_name: responderMap.get(r.responder_id) || 'Staff'
        })) || []
      }));
    },
    enabled: isAdmin || isTrainer
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ subject, message, priority }: { subject: string; message: string; priority?: string }) => {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user!.id,
          subject,
          message,
          priority: priority || 'normal'
        });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      toast.success('Support ticket created');
    },
    onError: (error) => {
      toast.error('Failed to create ticket: ' + error.message);
    }
  });
}

export function useRespondToTicket() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      const { error } = await supabase
        .from('support_responses')
        .insert({
          ticket_id: ticketId,
          responder_id: user!.id,
          message
        });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      toast.success('Response sent');
    },
    onError: (error) => {
      toast.error('Failed to send response: ' + error.message);
    }
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      toast.success('Ticket status updated');
    },
    onError: (error) => {
      toast.error('Failed to update ticket: ' + error.message);
    }
  });
}
