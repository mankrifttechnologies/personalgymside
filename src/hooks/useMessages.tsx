import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export function useMessages(friendId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([]);

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', user?.id, friendId],
    queryFn: async () => {
      if (!user?.id || !friendId) return [];
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user?.id && !!friendId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.id || !friendId) return;

    const channel = supabase
      .channel(`messages-${user.id}-${friendId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Only add if it's between us and the friend
          if (
            (newMessage.sender_id === user.id && newMessage.receiver_id === friendId) ||
            (newMessage.sender_id === friendId && newMessage.receiver_id === user.id)
          ) {
            setRealtimeMessages(prev => [...prev, newMessage]);
            queryClient.invalidateQueries({ queryKey: ['messages', user.id, friendId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, friendId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id || !friendId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: friendId,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', user?.id, friendId] });
    },
  });

  const markAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id || !friendId) return;

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', friendId)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unreadMessages', user?.id] });
    },
  });

  // Combine fetched and realtime messages
  const allMessages = [...(messages || []), ...realtimeMessages.filter(
    rm => !messages?.some(m => m.id === rm.id)
  )];

  return {
    messages: allMessages,
    isLoading,
    sendMessage,
    markAsRead,
  };
}

export function useUnreadMessages() {
  const { user } = useAuth();

  const { data: unreadCount } = useQuery({
    queryKey: ['unreadMessages', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return { unreadCount };
}
