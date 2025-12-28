import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Workout, WorkoutExercise, MuscleGroup } from '@/types/fitness';

export function useWorkouts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: workouts, isLoading } = useQuery({
    queryKey: ['workouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('workout_date', { ascending: false });

      if (error) throw error;
      return data as Workout[];
    },
    enabled: !!user?.id,
  });

  const { data: todayWorkout } = useQuery({
    queryKey: ['todayWorkout', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('workouts')
        .select('*, workout_exercises(*)')
        .eq('user_id', user.id)
        .eq('workout_date', today)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const createWorkout = useMutation({
    mutationFn: async ({ date, notes }: { date: string; notes?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          workout_date: date,
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Workout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['todayWorkout', user?.id] });
    },
  });

  const addExercise = useMutation({
    mutationFn: async (exercise: Omit<WorkoutExercise, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('workout_exercises')
        .insert(exercise)
        .select()
        .single();

      if (error) throw error;

      // Update muscle recovery
      await supabase
        .from('muscle_recovery')
        .upsert({
          user_id: user?.id,
          muscle_group: exercise.muscle_group,
          last_trained_date: new Date().toISOString().split('T')[0],
        }, {
          onConflict: 'user_id,muscle_group',
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['todayWorkout', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['muscleRecovery', user?.id] });
    },
  });

  return {
    workouts,
    todayWorkout,
    isLoading,
    createWorkout,
    addExercise,
  };
}

export function useMuscleRecovery() {
  const { user } = useAuth();

  const { data: muscleRecovery, isLoading } = useQuery({
    queryKey: ['muscleRecovery', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('muscle_recovery')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const getRecoveryStatus = (muscleGroup: MuscleGroup): { status: 'recovered' | 'recovering' | 'fresh'; days: number } => {
    const recovery = muscleRecovery?.find(r => r.muscle_group === muscleGroup);
    
    if (!recovery) {
      return { status: 'fresh', days: 0 };
    }

    const lastTrained = new Date(recovery.last_trained_date);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - lastTrained.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff >= 3) {
      return { status: 'recovered', days: daysDiff };
    } else if (daysDiff >= 1) {
      return { status: 'recovering', days: daysDiff };
    } else {
      return { status: 'recovering', days: 0 };
    }
  };

  return {
    muscleRecovery,
    isLoading,
    getRecoveryStatus,
  };
}
