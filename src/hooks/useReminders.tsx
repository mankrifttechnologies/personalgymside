import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface WorkoutReminder {
  id: string;
  user_id: string;
  reminder_time: string;
  days_of_week: number[];
  is_enabled: boolean;
  reminder_message: string;
  created_at: string;
  updated_at: string;
}

export function useReminders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reminder, isLoading } = useQuery({
    queryKey: ['reminder', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('workout_reminders')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as WorkoutReminder | null;
    },
    enabled: !!user?.id,
  });

  const upsertReminder = useMutation({
    mutationFn: async (updates: Partial<WorkoutReminder>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('workout_reminders')
        .upsert({
          user_id: user.id,
          ...updates,
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder', user?.id] });
    },
  });

  // Check if reminder should show
  const shouldShowReminder = (): boolean => {
    if (!reminder || !reminder.is_enabled) return false;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);

    if (!reminder.days_of_week.includes(currentDay)) return false;

    const reminderTime = reminder.reminder_time.slice(0, 5);
    const timeDiff = getTimeDifferenceMinutes(reminderTime, currentTime);

    // Show if within 30 minutes of reminder time
    return timeDiff >= 0 && timeDiff <= 30;
  };

  const getTimeDifferenceMinutes = (time1: string, time2: string): number => {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    return (h2 * 60 + m2) - (h1 * 60 + m1);
  };

  return {
    reminder,
    isLoading,
    upsertReminder,
    shouldShowReminder,
  };
}
