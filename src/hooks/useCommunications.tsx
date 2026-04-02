import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useOverduePayments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['comms', 'overdue-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_records')
        .select('id, member_id, amount, due_date, currency, status')
        .in('status', ['pending', 'overdue'])
        .order('due_date', { ascending: true });
      if (error) throw error;

      // Get member profiles
      const memberIds = [...new Set(data?.map(p => p.member_id) || [])];
      const { data: members } = await supabase
        .from('gym_members')
        .select('id, user_id')
        .in('id', memberIds);

      const userIds = members?.map(m => m.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);

      const memberUserMap = new Map(members?.map(m => [m.id, m.user_id]) || []);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      return (data || []).map(p => ({
        ...p,
        user_id: memberUserMap.get(p.member_id),
        member_name: profileMap.get(memberUserMap.get(p.member_id) || '') || 'Unknown',
      }));
    },
    enabled: !!user,
  });
}

export function useSendBulkMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipientIds, content }: { recipientIds: string[]; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      const messages = recipientIds.map(receiverId => ({
        sender_id: user.id,
        receiver_id: receiverId,
        content,
        is_read: false,
      }));

      const { error } = await supabase.from('messages').insert(messages);
      if (error) throw error;
      return messages.length;
    },
    onSuccess: (count) => {
      toast.success(`Sent to ${count} members`);
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: () => toast.error('Failed to send messages'),
  });
}

export function useMembersByFilter() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['comms', 'all-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, tier, is_approved, fitness_goal');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useFeedbackForms() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['feedback-forms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback_forms')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useCreateFeedbackForm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, description, questions }: { title: string; description?: string; questions: any[] }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('feedback_forms').insert({
        title,
        description,
        questions,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Feedback form created');
      queryClient.invalidateQueries({ queryKey: ['feedback-forms'] });
    },
    onError: () => toast.error('Failed to create form'),
  });
}

export function useFeedbackResponses(formId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['feedback-responses', formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback_responses')
        .select('*')
        .eq('form_id', formId!)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const userIds = [...new Set(data?.map(r => r.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      return (data || []).map(r => ({
        ...r,
        user_name: profileMap.get(r.user_id) || 'Unknown',
      }));
    },
    enabled: !!user && !!formId,
  });
}
