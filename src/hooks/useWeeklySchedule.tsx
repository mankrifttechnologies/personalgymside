import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ScheduleEntry {
  id: string;
  user_id: string;
  day_of_week: number;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleWithTemplate extends ScheduleEntry {
  template: {
    id: string;
    name: string;
    category: string;
    description: string | null;
  } | null;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const DAYS_OF_WEEK = DAY_NAMES.map((name, index) => ({
  value: index,
  label: name,
  short: name.slice(0, 3),
}));

export function useWeeklySchedule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['weekly-schedule', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('weekly_schedule')
        .select(`
          *,
          template:workout_templates(id, name, category, description)
        `)
        .eq('user_id', user.id)
        .order('day_of_week');
      
      if (error) throw error;
      return data as ScheduleWithTemplate[];
    },
    enabled: !!user,
  });

  const setDayTemplate = useMutation({
    mutationFn: async ({ dayOfWeek, templateId }: { dayOfWeek: number; templateId: string | null }) => {
      if (!user) throw new Error('Not authenticated');

      if (templateId === null) {
        // Remove the schedule entry for this day
        const { error } = await supabase
          .from('weekly_schedule')
          .delete()
          .eq('user_id', user.id)
          .eq('day_of_week', dayOfWeek);
        
        if (error) throw error;
        return null;
      }

      // Upsert the schedule entry
      const { data, error } = await supabase
        .from('weekly_schedule')
        .upsert({
          user_id: user.id,
          day_of_week: dayOfWeek,
          template_id: templateId,
        }, {
          onConflict: 'user_id,day_of_week'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] });
    },
  });

  const getScheduleForDay = (dayOfWeek: number): ScheduleWithTemplate | undefined => {
    return schedule?.find(s => s.day_of_week === dayOfWeek);
  };

  const getTodaySchedule = (): ScheduleWithTemplate | undefined => {
    const today = new Date().getDay();
    return getScheduleForDay(today);
  };

  return {
    schedule,
    isLoading,
    setDayTemplate,
    getScheduleForDay,
    getTodaySchedule,
    DAYS_OF_WEEK,
  };
}
