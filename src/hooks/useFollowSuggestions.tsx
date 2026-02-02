import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SuggestedUser {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  mutual_count: number;
}

export function useFollowSuggestions() {
  const { user } = useAuth();

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['follow-suggestions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get users I'm following
      const { data: myFollowing, error: followingError } = await supabase
        .from('member_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followingError) throw followingError;

      const myFollowingIds = myFollowing.map(f => f.following_id);

      if (myFollowingIds.length === 0) {
        // If not following anyone, suggest popular users
        const { data: popularUsers, error } = await supabase
          .from('member_follows')
          .select('following_id')
          .limit(100);

        if (error) throw error;

        // Count followers for each user
        const followerCounts: Record<string, number> = {};
        popularUsers.forEach(f => {
          followerCounts[f.following_id] = (followerCounts[f.following_id] || 0) + 1;
        });

        // Get top users excluding self
        const topUserIds = Object.entries(followerCounts)
          .filter(([id]) => id !== user.id)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([id]) => id);

        if (topUserIds.length === 0) return [];

        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, name, avatar_url')
          .in('user_id', topUserIds);

        if (profilesError) throw profilesError;

        return profiles.map(p => ({
          ...p,
          mutual_count: 0,
        })) as SuggestedUser[];
      }

      // Get users that people I follow are following (friends of friends)
      const { data: friendsOfFriends, error: fofError } = await supabase
        .from('member_follows')
        .select('following_id')
        .in('follower_id', myFollowingIds)
        .not('following_id', 'eq', user.id)
        .not('following_id', 'in', `(${myFollowingIds.join(',')})`);

      if (fofError) throw fofError;

      if (friendsOfFriends.length === 0) return [];

      // Count how many mutual connections each suggested user has
      const mutualCounts: Record<string, number> = {};
      friendsOfFriends.forEach(f => {
        mutualCounts[f.following_id] = (mutualCounts[f.following_id] || 0) + 1;
      });

      // Get top 5 suggestions sorted by mutual connections
      const sortedSuggestions = Object.entries(mutualCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      if (sortedSuggestions.length === 0) return [];

      const suggestionIds = sortedSuggestions.map(([id]) => id);

      // Get profiles for suggestions
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', suggestionIds);

      if (profilesError) throw profilesError;

      // Combine with mutual counts
      return profiles.map(p => ({
        ...p,
        mutual_count: mutualCounts[p.user_id] || 0,
      })).sort((a, b) => b.mutual_count - a.mutual_count) as SuggestedUser[];
    },
    enabled: !!user?.id,
  });

  return {
    suggestions,
    isLoading,
  };
}
