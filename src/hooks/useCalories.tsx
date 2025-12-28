import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { CalorieEntry, MealType } from '@/types/fitness';

export function useCalories(date?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetDate = date || new Date().toISOString().split('T')[0];

  const { data: entries, isLoading } = useQuery({
    queryKey: ['calories', user?.id, targetDate],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('calorie_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('entry_date', targetDate)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as CalorieEntry[];
    },
    enabled: !!user?.id,
  });

  const addEntry = useMutation({
    mutationFn: async (entry: {
      food_name: string;
      calories: number;
      protein_g?: number;
      carbs_g?: number;
      fats_g?: number;
      meal_type?: MealType;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('calorie_entries')
        .insert({
          user_id: user.id,
          entry_date: targetDate,
          ...entry,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calories', user?.id, targetDate] });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from('calorie_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calories', user?.id, targetDate] });
    },
  });

  const totals = entries?.reduce(
    (acc, entry) => ({
      calories: acc.calories + (entry.calories || 0),
      protein: acc.protein + (entry.protein_g || 0),
      carbs: acc.carbs + (entry.carbs_g || 0),
      fats: acc.fats + (entry.fats_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  ) || { calories: 0, protein: 0, carbs: 0, fats: 0 };

  return {
    entries,
    isLoading,
    addEntry,
    deleteEntry,
    totals,
  };
}
