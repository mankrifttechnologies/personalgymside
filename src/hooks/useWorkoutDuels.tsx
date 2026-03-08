import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useEffect } from 'react';

export function useWorkoutDuels() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const duelsQuery = useQuery({
    queryKey: ['workout-duels', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('workout_duels')
        .select('*')
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('duels-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workout_duels' }, () => {
        queryClient.invalidateQueries({ queryKey: ['workout-duels'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const createDuel = useMutation({
    mutationFn: async ({ opponentId, duelType, targetValue }: { opponentId: string; duelType: string; targetValue: number }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('workout_duels')
        .insert({
          challenger_id: user.id,
          opponent_id: opponentId,
          duel_type: duelType,
          target_value: targetValue,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-duels'] });
      toast.success('Duel challenge sent! ⚔️');
    },
    onError: () => toast.error('Failed to create duel'),
  });

  const respondDuel = useMutation({
    mutationFn: async ({ duelId, accept }: { duelId: string; accept: boolean }) => {
      const { error } = await supabase
        .from('workout_duels')
        .update({ status: accept ? 'active' : 'declined' })
        .eq('id', duelId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['workout-duels'] });
      toast.success(vars.accept ? 'Duel accepted! Let\'s go! 💪' : 'Duel declined');
    },
    onError: () => toast.error('Failed to respond to duel'),
  });

  const updateScore = useMutation({
    mutationFn: async ({ duelId, score }: { duelId: string; score: number }) => {
      if (!user) throw new Error('Not authenticated');
      const duel = duelsQuery.data?.find(d => d.id === duelId);
      if (!duel) throw new Error('Duel not found');
      
      const isChallenger = duel.challenger_id === user.id;
      const updateField = isChallenger ? 'challenger_score' : 'opponent_score';
      
      const { error } = await supabase
        .from('workout_duels')
        .update({ [updateField]: score })
        .eq('id', duelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-duels'] });
    },
  });

  const activeDuels = (duelsQuery.data || []).filter(d => d.status === 'active');
  const pendingDuels = (duelsQuery.data || []).filter(d => d.status === 'pending');
  const completedDuels = (duelsQuery.data || []).filter(d => d.status === 'completed');

  return {
    duels: duelsQuery.data || [],
    activeDuels,
    pendingDuels,
    completedDuels,
    isLoading: duelsQuery.isLoading,
    createDuel,
    respondDuel,
    updateScore,
  };
}
