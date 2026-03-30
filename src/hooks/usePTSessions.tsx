import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useTrainers() {
  return useQuery({
    queryKey: ['trainers'],
    queryFn: async () => {
      const { data: trainerRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'trainer');

      if (!trainerRoles?.length) return [];

      const trainerIds = trainerRoles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', trainerIds);

      return profiles || [];
    },
  });
}

export function usePTSessions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['pt-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('pt_sessions')
        .select('*')
        .or(`member_id.eq.${user.id},trainer_id.eq.${user.id}`)
        .order('session_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const bookSession = useMutation({
    mutationFn: async (session: {
      trainer_id: string;
      session_date: string;
      start_time: string;
      end_time: string;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('pt_sessions').insert({
        ...session,
        member_id: user.id,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-sessions'] });
      toast.success('Session booked! Waiting for trainer confirmation.');
    },
    onError: () => toast.error('Failed to book session'),
  });

  const updateSessionStatus = useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: string }) => {
      const { error } = await supabase
        .from('pt_sessions')
        .update({ status })
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-sessions'] });
      toast.success('Session updated');
    },
  });

  const upcomingSessions = sessions?.filter(
    s => s.status !== 'cancelled' && new Date(s.session_date) >= new Date(new Date().toDateString())
  ) || [];

  const pastSessions = sessions?.filter(
    s => new Date(s.session_date) < new Date(new Date().toDateString())
  ) || [];

  return { sessions, upcomingSessions, pastSessions, isLoading, bookSession, updateSessionStatus };
}
