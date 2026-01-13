import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeAttendance() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('attendance-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_logs'
        },
        (payload) => {
          console.log('Attendance update:', payload);
          // Invalidate all attendance-related queries
          queryClient.invalidateQueries({ queryKey: ['attendance-logs'] });
          queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
          queryClient.invalidateQueries({ queryKey: ['member-streak'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'member_streaks'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['member-streak'] });
          queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'points_wallet'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['points-wallet'] });
          queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'member_badges'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['member-badges'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
