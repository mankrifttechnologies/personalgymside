import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { MuscleGroup } from '@/types/fitness';

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  is_system: boolean;
  user_id: string | null;
  created_at: string;
}

export interface WorkoutTemplateExercise {
  id: string;
  template_id: string;
  exercise_name: string;
  muscle_group: MuscleGroup;
  sets: number;
  reps: number;
  order_index: number;
  notes: string | null;
  created_at: string;
}

export interface TemplateWithExercises extends WorkoutTemplate {
  exercises: WorkoutTemplateExercise[];
}

export function useWorkoutTemplates() {
  const { user } = useAuth();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['workoutTemplates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_templates')
        .select(`
          *,
          workout_template_exercises(*)
        `)
        .order('name');

      if (error) throw error;

      return data.map(template => ({
        ...template,
        exercises: (template.workout_template_exercises as WorkoutTemplateExercise[])
          .sort((a, b) => a.order_index - b.order_index),
      })) as TemplateWithExercises[];
    },
    enabled: !!user?.id,
  });

  const getTemplatesByCategory = (category: string): TemplateWithExercises[] => {
    return templates?.filter(t => t.category === category) || [];
  };

  const getSystemTemplates = (): TemplateWithExercises[] => {
    return templates?.filter(t => t.is_system) || [];
  };

  const getUserTemplates = (): TemplateWithExercises[] => {
    return templates?.filter(t => !t.is_system && t.user_id === user?.id) || [];
  };

  return {
    templates,
    isLoading,
    getTemplatesByCategory,
    getSystemTemplates,
    getUserTemplates,
  };
}

export const TEMPLATE_CATEGORIES = [
  { value: 'push', label: 'Push', icon: '💪', color: 'bg-muscle-chest' },
  { value: 'pull', label: 'Pull', icon: '🏋️', color: 'bg-muscle-back' },
  { value: 'legs', label: 'Legs', icon: '🦵', color: 'bg-muscle-legs' },
  { value: 'upper', label: 'Upper Body', icon: '👆', color: 'bg-muscle-shoulders' },
  { value: 'lower', label: 'Lower Body', icon: '👇', color: 'bg-muscle-legs' },
  { value: 'full_body', label: 'Full Body', icon: '🔥', color: 'bg-primary' },
];
