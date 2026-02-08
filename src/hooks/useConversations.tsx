import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isLastMessageFromMe: boolean;
}

export function useConversations() {
  const { user } = useAuth();

  const { data: conversations, isLoading, refetch } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all messages involving the current user
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation partner
      const conversationsMap = new Map<string, {
        partnerId: string;
        lastMessage: string;
        lastMessageTime: string;
        unreadCount: number;
        isLastMessageFromMe: boolean;
      }>();

      messages?.forEach((msg) => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        
        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, {
            partnerId,
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unreadCount: msg.receiver_id === user.id && !msg.is_read ? 1 : 0,
            isLastMessageFromMe: msg.sender_id === user.id,
          });
        } else {
          const existing = conversationsMap.get(partnerId)!;
          if (msg.receiver_id === user.id && !msg.is_read) {
            existing.unreadCount += 1;
          }
        }
      });

      // Get partner profiles
      const partnerIds = Array.from(conversationsMap.keys());
      if (partnerIds.length === 0) return [];

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', partnerIds);

      if (profileError) throw profileError;

      // Combine conversations with profile info
      const conversationsList: Conversation[] = [];
      
      conversationsMap.forEach((conv, partnerId) => {
        const profile = profiles?.find(p => p.user_id === partnerId);
        conversationsList.push({
          ...conv,
          partnerName: profile?.name || 'Unknown User',
          partnerAvatar: profile?.avatar_url || null,
        });
      });

      // Sort by last message time
      conversationsList.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );

      return conversationsList;
    },
    enabled: !!user?.id,
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`conversations-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new as any;
          if (msg?.sender_id === user.id || msg?.receiver_id === user.id) {
            refetch();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  return {
    conversations: conversations || [],
    isLoading,
    refetch,
  };
}
