import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TypingStatus {
  userId: string;
  isTyping: boolean;
}

export function useTypingIndicator(friendId: string) {
  const { user } = useAuth();
  const [friendIsTyping, setFriendIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeoutState] = useState<NodeJS.Timeout | null>(null);

  // Subscribe to typing indicator channel
  useEffect(() => {
    if (!user || !friendId) return;

    const channelName = `typing-${[user.id, friendId].sort().join('-')}`;
    
    const channel = supabase.channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        
        // Check if friend is typing
        let friendTyping = false;
        for (const key of Object.keys(state)) {
          const presences = state[key] as unknown as (TypingStatus & { presence_ref: string })[];
          if (presences.some((p) => p.userId === friendId && p.isTyping)) {
            friendTyping = true;
            break;
          }
        }
        setFriendIsTyping(friendTyping);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track our presence with not typing initially
          await channel.track({
            userId: user.id,
            isTyping: false,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, friendId]);

  // Function to update typing status
  const setIsTyping = useCallback(async (isTyping: boolean) => {
    if (!user || !friendId) return;

    const channelName = `typing-${[user.id, friendId].sort().join('-')}`;
    const channel = supabase.channel(channelName);

    await channel.track({
      userId: user.id,
      isTyping,
    });

    // Auto-reset typing after 3 seconds of no input
    if (isTyping) {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      const timeout = setTimeout(() => {
        channel.track({
          userId: user.id,
          isTyping: false,
        });
      }, 3000);
      setTypingTimeoutState(timeout);
    }
  }, [user, friendId, typingTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  return {
    friendIsTyping,
    setIsTyping,
  };
}
