import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useUserFollowCounts(userId: string | null) {
  const { data: followersCount = 0, isLoading: followersLoading } = useQuery({
    queryKey: ['followers-count', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from('member_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });

  const { data: followingCount = 0, isLoading: followingLoading } = useQuery({
    queryKey: ['following-count', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from('member_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });

  return {
    followersCount,
    followingCount,
    isLoading: followersLoading || followingLoading,
  };
}
