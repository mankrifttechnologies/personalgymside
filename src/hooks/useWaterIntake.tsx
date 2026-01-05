import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useWaterIntake = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['water-entries', user?.id, today],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('water_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addWater = useMutation({
    mutationFn: async (amount_ml: number) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('water_entries')
        .insert({ user_id: user.id, amount_ml, entry_date: today })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water-entries'] });
    },
  });

  const removeWater = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('water_entries')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water-entries'] });
    },
  });

  const totalMl = entries.reduce((sum, e) => sum + e.amount_ml, 0);
  const dailyGoal = 2500; // ml
  const progress = Math.min((totalMl / dailyGoal) * 100, 100);
  const glasses = Math.floor(totalMl / 250);

  return {
    entries,
    isLoading,
    addWater,
    removeWater,
    totalMl,
    dailyGoal,
    progress,
    glasses,
  };
};
