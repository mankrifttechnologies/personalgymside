import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useFriendData(friendUserId?: string) {
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['friendProfile', friendUserId],
    queryFn: async () => {
      if (!friendUserId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', friendUserId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!friendUserId && !!user?.id,
  });

  const { data: workouts, isLoading: workoutsLoading } = useQuery({
    queryKey: ['friendWorkouts', friendUserId],
    queryFn: async () => {
      if (!friendUserId) return [];
      
      const { data, error } = await supabase
        .from('workouts')
        .select('*, workout_exercises(*)')
        .eq('user_id', friendUserId)
        .order('workout_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!friendUserId && !!user?.id,
  });

  const { data: personalRecords, isLoading: prsLoading } = useQuery({
    queryKey: ['friendPRs', friendUserId],
    queryFn: async () => {
      if (!friendUserId) return [];
      
      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', friendUserId)
        .order('max_weight_kg', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!friendUserId && !!user?.id,
  });

  const { data: measurements, isLoading: measurementsLoading } = useQuery({
    queryKey: ['friendMeasurements', friendUserId],
    queryFn: async () => {
      if (!friendUserId) return [];
      
      const { data, error } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', friendUserId)
        .order('measurement_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!friendUserId && !!user?.id,
  });

  const { data: calorieEntries, isLoading: caloriesLoading } = useQuery({
    queryKey: ['friendCalories', friendUserId],
    queryFn: async () => {
      if (!friendUserId) return [];
      
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('calorie_entries')
        .select('*')
        .eq('user_id', friendUserId)
        .eq('entry_date', today);

      if (error) throw error;
      return data;
    },
    enabled: !!friendUserId && !!user?.id,
  });

  // Calculate streak for friend
  const { data: workoutDates } = useQuery({
    queryKey: ['friendWorkoutDates', friendUserId],
    queryFn: async () => {
      if (!friendUserId) return [];
      
      const { data, error } = await supabase
        .from('workouts')
        .select('workout_date')
        .eq('user_id', friendUserId)
        .order('workout_date', { ascending: false });

      if (error) throw error;
      return data.map(w => w.workout_date);
    },
    enabled: !!friendUserId && !!user?.id,
  });

  const calculateStreak = () => {
    if (!workoutDates || workoutDates.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const uniqueDates = [...new Set(workoutDates)].sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const hasToday = uniqueDates[0] === todayStr;
    const hasYesterday = uniqueDates[0] === yesterdayStr || uniqueDates[1] === yesterdayStr;

    if (!hasToday && !hasYesterday) return 0;

    let currentStreak = 0;
    let checkDate = hasToday ? today : yesterday;

    for (const dateStr of uniqueDates) {
      const expectedDate = checkDate.toISOString().split('T')[0];
      
      if (dateStr === expectedDate) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (new Date(dateStr) < checkDate) {
        break;
      }
    }

    return currentStreak;
  };

  const isLoading = profileLoading || workoutsLoading || prsLoading || measurementsLoading || caloriesLoading;

  return {
    profile,
    workouts,
    personalRecords,
    measurements,
    calorieEntries,
    streak: calculateStreak(),
    totalWorkouts: workoutDates?.length || 0,
    isLoading,
  };
}
