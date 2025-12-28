import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_name: string;
  muscle_group: string;
  max_weight_kg: number;
  max_reps: number;
  achieved_date: string;
  created_at: string;
  updated_at: string;
}

export function usePersonalRecords() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: records, isLoading } = useQuery({
    queryKey: ['personalRecords', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', user.id)
        .order('max_weight_kg', { ascending: false });

      if (error) throw error;
      return data as PersonalRecord[];
    },
    enabled: !!user?.id,
  });

  const checkAndUpdatePR = useMutation({
    mutationFn: async ({ 
      exerciseName, 
      muscleGroup, 
      weight, 
      reps 
    }: { 
      exerciseName: string; 
      muscleGroup: string; 
      weight: number; 
      reps: number; 
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Find existing PR for this exercise
      const existingPR = records?.find(
        r => r.exercise_name.toLowerCase() === exerciseName.toLowerCase()
      );

      // Check if this is a new PR (higher weight or same weight with more reps)
      const isNewPR = !existingPR || 
        weight > existingPR.max_weight_kg || 
        (weight === existingPR.max_weight_kg && reps > existingPR.max_reps);

      if (!isNewPR) return { isNewPR: false, record: existingPR };

      const { data, error } = await supabase
        .from('personal_records')
        .upsert({
          user_id: user.id,
          exercise_name: exerciseName,
          muscle_group: muscleGroup,
          max_weight_kg: weight,
          max_reps: reps,
          achieved_date: new Date().toISOString().split('T')[0],
        }, {
          onConflict: 'user_id,exercise_name',
        })
        .select()
        .single();

      if (error) throw error;
      return { isNewPR: true, record: data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalRecords', user?.id] });
    },
  });

  const getPRForExercise = (exerciseName: string): PersonalRecord | undefined => {
    return records?.find(
      r => r.exercise_name.toLowerCase() === exerciseName.toLowerCase()
    );
  };

  const getTopPRs = (limit: number = 5): PersonalRecord[] => {
    return records?.slice(0, limit) || [];
  };

  return {
    records,
    isLoading,
    checkAndUpdatePR,
    getPRForExercise,
    getTopPRs,
  };
}
