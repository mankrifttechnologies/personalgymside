import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import type { AppRole } from '@/types/attendance';

export interface OrgMember {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  is_approved: boolean;
  role: string;
  status: string;
  joined_at: string;
  org_member_id: string;
}

export function useOrgMembers(organizationId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['org-members', organizationId],
    queryFn: async (): Promise<OrgMember[]> => {
      if (!organizationId) return [];

      // Get organization members
      const { data: orgMembers, error } = await supabase
        .from('organization_members')
        .select('id, user_id, role, status, joined_at')
        .eq('organization_id', organizationId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      if (!orgMembers || orgMembers.length === 0) return [];

      // Get profiles for these members
      const userIds = orgMembers.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url, is_approved')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return orgMembers.map(m => {
        const profile = profileMap.get(m.user_id);
        return {
          user_id: m.user_id,
          name: profile?.name || null,
          avatar_url: profile?.avatar_url || null,
          is_approved: profile?.is_approved || false,
          role: m.role,
          status: m.status,
          joined_at: m.joined_at,
          org_member_id: m.id,
        };
      });
    },
    enabled: !!organizationId && !!user?.id,
  });
}

export function useRemoveOrgMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgMemberId }: { orgMemberId: string }) => {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', orgMemberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members'] });
      toast.success('Member removed from organization');
    },
    onError: (error) => {
      toast.error('Failed to remove member: ' + error.message);
    },
  });
}

export function useUpdateOrgMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgMemberId, role }: { orgMemberId: string; role: string }) => {
      const { error } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('id', orgMemberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members'] });
      toast.success('Member role updated');
    },
    onError: (error) => {
      toast.error('Failed to update role: ' + error.message);
    },
  });
}
