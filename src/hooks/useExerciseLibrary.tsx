import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { MuscleGroup } from '@/types/fitness';

export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  description: string | null;
  instructions: string | null;
  video_url: string | null;
  is_system: boolean;
  user_id: string | null;
  created_at: string;
}

export const useExerciseLibrary = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercise-library', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_library')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Exercise[];
    },
  });

  const getExercisesByMuscle = (muscleGroup: MuscleGroup) => {
    return exercises.filter(e => e.muscle_group === muscleGroup);
  };

  const addCustomExercise = useMutation({
    mutationFn: async ({ name, muscle_group, description, instructions }: { 
      name: string; 
      muscle_group: MuscleGroup; 
      description?: string; 
      instructions?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('exercise_library')
        .insert({ 
          name, 
          muscle_group, 
          description, 
          instructions,
          user_id: user.id,
          is_system: false 
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-library'] });
    },
  });

  const deleteExercise = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exercise_library')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-library'] });
    },
  });

  return {
    exercises,
    isLoading,
    getExercisesByMuscle,
    addCustomExercise,
    deleteExercise,
  };
};
