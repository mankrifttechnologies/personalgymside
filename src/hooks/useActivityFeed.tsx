import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Activity {
  id: string;
  user_id: string;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function useActivityFeed() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activityFeed', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('activity_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Activity[];
    },
    enabled: !!user?.id,
  });

  // Real-time subscription for activity feed
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['activityFeed', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const createActivity = useMutation({
    mutationFn: async (activity: {
      activity_type: string;
      title: string;
      description?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const insertData = {
        user_id: user.id,
        activity_type: activity.activity_type,
        title: activity.title,
        description: activity.description || null,
        metadata: activity.metadata as import('@/integrations/supabase/types').Json || null,
      };

      const { data, error } = await supabase
        .from('activity_feed')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as Activity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activityFeed', user?.id] });
    },
  });

  // Filter activities by type
  const myActivities = activities?.filter(a => a.user_id === user?.id) || [];
  const friendActivities = activities?.filter(a => a.user_id !== user?.id) || [];

  return {
    activities,
    myActivities,
    friendActivities,
    isLoading,
    createActivity,
  };
}
