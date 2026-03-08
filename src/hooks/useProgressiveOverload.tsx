import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface OverloadSuggestion {
  exercise_name: string;
  muscle_group: string;
  current_weight: number;
  current_reps: number;
  current_sets: number;
  suggested_weight: number;
  suggested_reps: number;
  trend: 'increase_weight' | 'increase_reps' | 'maintain' | 'deload';
  sessions_at_current: number;
  message: string;
}

export function useProgressiveOverload() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['progressive-overload', user?.id],
    queryFn: async (): Promise<OverloadSuggestion[]> => {
      if (!user?.id) return [];

      // Get last 30 days of workout exercises
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: workouts } = await supabase
        .from('workouts')
        .select('id, workout_date')
        .eq('user_id', user.id)
        .gte('workout_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('workout_date', { ascending: true });

      if (!workouts?.length) return [];

      const workoutIds = workouts.map(w => w.id);
      const { data: exercises } = await supabase
        .from('workout_exercises')
        .select('*')
        .in('workout_id', workoutIds);

      if (!exercises?.length) return [];

      // Group by exercise name and analyze progression
      const exerciseMap = new Map<string, typeof exercises>();
      exercises.forEach(ex => {
        const key = ex.exercise_name;
        if (!exerciseMap.has(key)) exerciseMap.set(key, []);
        exerciseMap.get(key)!.push(ex);
      });

      const suggestions: OverloadSuggestion[] = [];

      exerciseMap.forEach((entries, exerciseName) => {
        if (entries.length < 2) return;

        // Sort by workout date via workout_id mapping
        const sorted = entries.sort((a, b) => {
          const wA = workouts.find(w => w.id === a.workout_id);
          const wB = workouts.find(w => w.id === b.workout_id);
          return (wA?.workout_date || '').localeCompare(wB?.workout_date || '');
        });

        const latest = sorted[sorted.length - 1];
        const latestWeight = Number(latest.weight_kg) || 0;
        const latestReps = latest.reps;
        const latestSets = latest.sets;

        // Count sessions at current weight
        let sessionsAtCurrent = 0;
        for (let i = sorted.length - 1; i >= 0; i--) {
          if (Number(sorted[i].weight_kg) === latestWeight && sorted[i].reps === latestReps) {
            sessionsAtCurrent++;
          } else break;
        }

        let trend: OverloadSuggestion['trend'] = 'maintain';
        let suggestedWeight = latestWeight;
        let suggestedReps = latestReps;
        let message = '';

        if (sessionsAtCurrent >= 3 && latestWeight > 0) {
          // Ready to increase
          if (latestReps >= 12) {
            trend = 'increase_weight';
            suggestedWeight = Math.round((latestWeight * 1.05) * 2) / 2; // Round to nearest 0.5
            suggestedReps = 8;
            message = `You've hit ${latestReps} reps for ${sessionsAtCurrent} sessions. Time to increase weight to ${suggestedWeight}kg!`;
          } else if (latestReps < 12) {
            trend = 'increase_reps';
            suggestedReps = latestReps + 1;
            message = `Add 1 more rep. You're at ${latestReps} reps for ${sessionsAtCurrent} sessions.`;
          }
        } else if (sessionsAtCurrent >= 2 && latestWeight > 0) {
          trend = 'maintain';
          message = `Keep going! ${3 - sessionsAtCurrent} more session(s) before progressing.`;
        } else if (latestWeight === 0) {
          trend = 'maintain';
          message = 'Start tracking weight to get overload suggestions.';
        } else {
          trend = 'maintain';
          message = 'Building consistency. Keep it up!';
        }

        suggestions.push({
          exercise_name: exerciseName,
          muscle_group: latest.muscle_group,
          current_weight: latestWeight,
          current_reps: latestReps,
          current_sets: latestSets,
          suggested_weight: suggestedWeight,
          suggested_reps: suggestedReps,
          trend,
          sessions_at_current: sessionsAtCurrent,
          message,
        });
      });

      // Sort: actionable items first
      return suggestions.sort((a, b) => {
        const priority = { increase_weight: 0, increase_reps: 1, maintain: 2, deload: 3 };
        return priority[a.trend] - priority[b.trend];
      });
    },
    enabled: !!user?.id,
  });
}
