import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

/**
 * Returns active, non-expired announcements visible to the current user.
 * RLS enforces per-gym scoping; we just sort + drop expired client-side
 * so the cache shape matches what the UI expects.
 */
export function useAnnouncements() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['announcements', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gym_announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const now = Date.now();
      return (data || []).filter(
        a => !a.expires_at || new Date(a.expires_at).getTime() > now
      );
    },
    enabled: !!user,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (announcement: {
      title: string;
      message: string;
      announcement_type: string;
      priority: string;
      expires_at?: string;
      organization_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Auto-resolve owner's organization if not supplied
      let organization_id = announcement.organization_id;
      if (!organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();
        organization_id = org?.id;
      }

      const { error } = await supabase.from('gym_announcements').insert({
        ...announcement,
        organization_id,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      qc.invalidateQueries({ queryKey: ['org-announcements'] });
      toast.success('Announcement posted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gym_announcements').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      qc.invalidateQueries({ queryKey: ['org-announcements'] });
      toast.success('Announcement removed');
    },
  });
}
