import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useWorkoutStreak() {
  const { user } = useAuth();

  const { data: workouts, isLoading } = useQuery({
    queryKey: ['workoutDates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('workouts')
        .select('workout_date')
        .eq('user_id', user.id)
        .order('workout_date', { ascending: false });

      if (error) throw error;
      return data.map(w => w.workout_date);
    },
    enabled: !!user?.id,
  });

  const streak = useMemo(() => {
    if (!workouts || workouts.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get unique dates
    const uniqueDates = [...new Set(workouts)].sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if streak includes today or started yesterday
    const hasToday = uniqueDates[0] === todayStr;
    const hasYesterday = uniqueDates[0] === yesterdayStr || uniqueDates[1] === yesterdayStr;

    if (!hasToday && !hasYesterday) {
      return 0; // Streak broken
    }

    let currentStreak = 0;
    let checkDate = hasToday ? today : yesterday;

    for (const dateStr of uniqueDates) {
      const expectedDate = checkDate.toISOString().split('T')[0];
      
      if (dateStr === expectedDate) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (new Date(dateStr) < checkDate) {
        // Gap in streak
        break;
      }
    }

    return currentStreak;
  }, [workouts]);

  const longestStreak = useMemo(() => {
    if (!workouts || workouts.length === 0) return 0;

    const uniqueDates = [...new Set(workouts)]
      .map(d => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());

    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
      const diff = (uniqueDates[i].getTime() - uniqueDates[i-1].getTime()) / (1000 * 60 * 60 * 24);
      
      if (diff === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else if (diff > 1) {
        currentStreak = 1;
      }
    }

    return maxStreak;
  }, [workouts]);

  const totalWorkouts = workouts?.length || 0;

  return {
    streak,
    longestStreak,
    totalWorkouts,
    isLoading,
  };
}
