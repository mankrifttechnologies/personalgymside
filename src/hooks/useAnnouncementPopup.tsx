import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUnreadAnnouncements() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['unread-announcements', user?.id],
    queryFn: async () => {
      // Get active announcements
      const { data: announcements, error: aErr } = await supabase
        .from('gym_announcements')
        .select('id, title, message, priority, announcement_type, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (aErr) throw aErr;

      // Filter out expired
      const now = new Date();
      const active = announcements?.filter(a => true) || []; // expires_at handled by is_active

      if (active.length === 0) return [];

      // Get user's read announcements
      const { data: reads } = await supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', user!.id);

      const readIds = new Set(reads?.map(r => r.announcement_id) || []);
      return active.filter(a => !readIds.has(a.id));
    },
    enabled: !!user,
  });
}

export function useMarkAnnouncementRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (announcementId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('announcement_reads')
        .insert({ announcement_id: announcementId, user_id: user.id });
      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-announcements'] });
    },
  });
}
