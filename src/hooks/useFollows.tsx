import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useFollows() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get users I'm following
  const { data: following = [], isLoading: followingLoading } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('member_follows')
        .select('following_id, created_at')
        .eq('follower_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get my followers
  const { data: followers = [], isLoading: followersLoading } = useQuery({
    queryKey: ['followers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('member_follows')
        .select('follower_id, created_at')
        .eq('following_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const followUser = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('member_follows')
        .insert({ follower_id: user.id, following_id: targetUserId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
      toast.success('Now following this member!');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Already following this member');
      } else {
        toast.error('Failed to follow');
      }
    },
  });

  const unfollowUser = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('member_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
      toast.success('Unfollowed member');
    },
    onError: () => {
      toast.error('Failed to unfollow');
    },
  });

  const isFollowing = (userId: string) => {
    return following.some(f => f.following_id === userId);
  };

  const toggleFollow = async (userId: string) => {
    if (isFollowing(userId)) {
      await unfollowUser.mutateAsync(userId);
    } else {
      await followUser.mutateAsync(userId);
    }
  };

  return {
    following,
    followers,
    followingCount: following.length,
    followersCount: followers.length,
    followingLoading,
    followersLoading,
    followUser,
    unfollowUser,
    isFollowing,
    toggleFollow,
    isLoading: followUser.isPending || unfollowUser.isPending,
  };
}
