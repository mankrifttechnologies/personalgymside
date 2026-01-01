import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface FriendProfile {
  id: string;
  user_id: string;
  name: string | null;
  friend_code: string | null;
  fitness_goal: string | null;
}

export interface FriendWithProfile extends Friendship {
  friend_profile?: FriendProfile;
  user_profile?: FriendProfile;
}

function generateFriendCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function useFriends() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get user's friend code
  const { data: myProfile } = useQuery({
    queryKey: ['my-profile-code', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('friend_code, name')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get all friendships with profiles
  const { data: friendships, isLoading } = useQuery({
    queryKey: ['friendships', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
      
      if (error) throw error;
      
      // Fetch profiles for all friends
      const friendIds = data.map(f => f.user_id === user.id ? f.friend_id : f.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, fitness_goal')
        .in('user_id', friendIds);
      
      // Attach profiles to friendships
      return data.map(f => {
        const friendUserId = f.user_id === user.id ? f.friend_id : f.user_id;
        const profile = profiles?.find(p => p.user_id === friendUserId);
        return { ...f, friendUserId, profile };
      });
    },
    enabled: !!user,
  });

  // Generate friend code if not exists
  const generateCode = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const code = generateFriendCode();
      const { data, error } = await supabase
        .from('profiles')
        .update({ friend_code: code })
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile-code'] });
    },
  });

  // Send friend request by code
  const sendFriendRequest = useMutation({
    mutationFn: async (friendCode: string) => {
      if (!user) throw new Error('Not authenticated');
      
      // Find user by friend code
      const { data: friendProfile, error: findError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('friend_code', friendCode.toUpperCase())
        .single();
      
      if (findError || !friendProfile) {
        throw new Error('Friend code not found');
      }

      if (friendProfile.user_id === user.id) {
        throw new Error("You can't add yourself as a friend");
      }

      // Check if already friends
      const { data: existing } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendProfile.user_id}),and(user_id.eq.${friendProfile.user_id},friend_id.eq.${user.id})`)
        .single();

      if (existing) {
        throw new Error('Friend request already exists');
      }

      // Send request
      const { data, error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: friendProfile.user_id,
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
    },
  });

  // Accept friend request
  const acceptRequest = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { data, error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
    },
  });

  // Decline/remove friend
  const removeFriend = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
    },
  });

  // Get accepted friends
  const acceptedFriends = friendships?.filter(f => f.status === 'accepted') || [];
  
  // Get pending requests (received)
  const pendingRequests = friendships?.filter(
    f => f.status === 'pending' && f.friend_id === user?.id
  ) || [];

  // Get sent requests
  const sentRequests = friendships?.filter(
    f => f.status === 'pending' && f.user_id === user?.id
  ) || [];

  return {
    myProfile,
    friendships,
    acceptedFriends,
    pendingRequests,
    sentRequests,
    isLoading,
    generateCode,
    sendFriendRequest,
    acceptRequest,
    removeFriend,
  };
}
