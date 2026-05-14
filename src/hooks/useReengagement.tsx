import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface InactiveMember {
  member_id: string;
  user_id: string;
  name: string;
  phone: string | null;
  last_check_in: string | null;
  days_inactive: number;
  bucket: 7 | 14 | 30;
}

export function useInactiveMembers(organizationId?: string) {
  return useQuery({
    queryKey: ['inactive-members', organizationId],
    queryFn: async (): Promise<InactiveMember[]> => {
      if (!organizationId) return [];
      const { data: members } = await supabase
        .from('gym_members')
        .select('id, user_id, joined_at')
        .eq('organization_id', organizationId)
        .eq('status', 'active');
      if (!members?.length) return [];

      const memberIds = members.map(m => m.id);
      const userIds = members.map(m => m.user_id);

      const [{ data: profiles }, { data: logs }] = await Promise.all([
        supabase.from('profiles').select('user_id, name, phone').in('user_id', userIds),
        supabase
          .from('attendance_logs')
          .select('member_id, check_in_time')
          .in('member_id', memberIds)
          .order('check_in_time', { ascending: false }),
      ]);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      const lastCheckin = new Map<string, string>();
      (logs || []).forEach((l: any) => {
        if (!lastCheckin.has(l.member_id)) lastCheckin.set(l.member_id, l.check_in_time);
      });

      const now = Date.now();
      const out: InactiveMember[] = [];
      for (const m of members) {
        const last = lastCheckin.get(m.id) || m.joined_at;
        const days = Math.floor((now - new Date(last).getTime()) / 86400000);
        if (days < 7) continue;
        const bucket: 7 | 14 | 30 = days >= 30 ? 30 : days >= 14 ? 14 : 7;
        const profile: any = profileMap.get(m.user_id);
        out.push({
          member_id: m.id,
          user_id: m.user_id,
          name: profile?.name || 'Member',
          phone: profile?.phone || null,
          last_check_in: lastCheckin.get(m.id) || null,
          days_inactive: days,
          bucket,
        });
      }
      return out.sort((a, b) => b.days_inactive - a.days_inactive);
    },
    enabled: !!organizationId,
  });
}

export function useLogReengagementContact() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { organization_id: string; member_id: string; channel: string; message?: string }) => {
      const { error } = await supabase.from('reengagement_contacts' as any).insert({
        organization_id: input.organization_id,
        member_id: input.member_id,
        channel: input.channel,
        message: input.message || null,
        contacted_by: user!.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['reengagement-contacts', vars.organization_id] });
      toast.success('Contact logged');
    },
  });
}

export function useReengagementContacts(organizationId?: string) {
  return useQuery({
    queryKey: ['reengagement-contacts', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data } = await supabase
        .from('reengagement_contacts' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .order('contacted_at', { ascending: false })
        .limit(200);
      return (data || []) as any[];
    },
    enabled: !!organizationId,
  });
}
