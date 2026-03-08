import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const GYM_CAPACITY = 50; // Default gym capacity

export function useGymOccupancy() {
  const queryClient = useQueryClient();

  const { data: checkedInCount = 0, isLoading } = useQuery({
    queryKey: ['gym-occupancy'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('attendance_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'checked_in');

      if (error) {
        console.error('Error fetching occupancy:', error);
        return 0;
      }
      return count || 0;
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('occupancy-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_logs' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['gym-occupancy'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const occupancyPercent = Math.min((checkedInCount / GYM_CAPACITY) * 100, 100);
  const status = occupancyPercent < 40 ? 'low' : occupancyPercent < 75 ? 'moderate' : 'high';

  return {
    checkedInCount,
    capacity: GYM_CAPACITY,
    occupancyPercent,
    status,
    isLoading,
  };
}
