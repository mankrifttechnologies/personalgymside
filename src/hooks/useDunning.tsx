import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DunningRule {
  id: string;
  organization_id: string;
  name: string;
  days_offset: number;
  message_template: string;
  channels: string[];
  is_active: boolean;
  auto_suspend_after_days: number | null;
  created_at: string;
  updated_at: string;
}

export interface QueuedNotification {
  id: string;
  organization_id: string | null;
  recipient_user_id: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  channel: string;
  template_key: string | null;
  message: string;
  status: string;
  scheduled_for: string;
  sent_at: string | null;
  error: string | null;
  created_at: string;
}

export function useDunningRules(organizationId?: string) {
  return useQuery({
    queryKey: ['dunning-rules', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('dunning_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .order('days_offset', { ascending: true });
      if (error) throw error;
      return (data || []) as DunningRule[];
    },
    enabled: !!organizationId,
  });
}

export function useUpsertDunningRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Partial<DunningRule> & { organization_id: string; name: string; days_offset: number; message_template: string }) => {
      const payload = {
        organization_id: rule.organization_id,
        name: rule.name,
        days_offset: rule.days_offset,
        message_template: rule.message_template,
        channels: rule.channels ?? ['in_app'],
        is_active: rule.is_active ?? true,
        auto_suspend_after_days: rule.auto_suspend_after_days ?? null,
      };
      if (rule.id) {
        const { error } = await supabase.from('dunning_rules').update(payload as any).eq('id', rule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('dunning_rules').insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['dunning-rules', vars.organization_id] });
      toast.success('Rule saved');
    },
    onError: (e: any) => toast.error('Failed: ' + e.message),
  });
}

export function useDeleteDunningRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dunning_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dunning-rules'] });
      toast.success('Rule deleted');
    },
  });
}

export function useNotificationQueue(organizationId?: string) {
  return useQuery({
    queryKey: ['notification-queue', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('organization_id', organizationId)
        .order('scheduled_for', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as QueuedNotification[];
    },
    enabled: !!organizationId,
  });
}

/**
 * Generates dunning notifications based on overdue payment_records
 * by matching enabled rules. Inserts into notification_queue.
 */
export function useRunDunningSweep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (organizationId: string) => {
      // 1. Fetch active rules
      const { data: rules, error: rulesErr } = await supabase
        .from('dunning_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true);
      if (rulesErr) throw rulesErr;
      if (!rules?.length) return { queued: 0, suspended: 0 };

      // 2. Fetch members in this org
      const { data: members, error: memErr } = await supabase
        .from('gym_members')
        .select('id, user_id, status')
        .eq('organization_id', organizationId);
      if (memErr) throw memErr;
      const memberIds = members?.map(m => m.id) ?? [];
      if (!memberIds.length) return { queued: 0, suspended: 0 };

      // 3. Fetch unpaid payment records
      const { data: payments, error: payErr } = await supabase
        .from('payment_records')
        .select('id, member_id, due_date, amount, currency, status')
        .in('member_id', memberIds)
        .neq('status', 'paid')
        .not('due_date', 'is', null);
      if (payErr) throw payErr;
      if (!payments?.length) return { queued: 0, suspended: 0 };

      // 4. Fetch profiles for names/phones
      const userIds = members?.map(m => m.user_id).filter(Boolean) ?? [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);
      const memberMap = new Map(members?.map(m => [m.id, m]) ?? []);
      const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const queueRows: any[] = [];
      const suspendIds: string[] = [];

      for (const payment of payments as any[]) {
        const due = new Date(payment.due_date);
        due.setHours(0, 0, 0, 0);
        const daysOverdue = Math.floor((today.getTime() - due.getTime()) / 86400000);
        const member = memberMap.get(payment.member_id);
        if (!member) continue;
        const profile: any = profileMap.get(member.user_id);
        const name = profile?.name || 'Member';
        const phone: string | null = null; // phone not yet on profiles

        for (const rule of rules as DunningRule[]) {
          // days_offset: negative = before due, positive = after due
          if (daysOverdue !== rule.days_offset) continue;
          const message = rule.message_template
            .replace(/\{name\}/g, name)
            .replace(/\{amount\}/g, `${payment.currency} ${payment.amount}`)
            .replace(/\{days\}/g, String(Math.abs(daysOverdue)))
            .replace(/\{due_date\}/g, payment.due_date);

          for (const channel of rule.channels) {
            queueRows.push({
              organization_id: organizationId,
              recipient_user_id: member.user_id,
              recipient_name: name,
              recipient_phone: phone,
              channel,
              template_key: rule.name,
              message,
              status: 'pending',
              scheduled_for: new Date().toISOString(),
            });
          }

          // Auto-suspend check
          if (rule.auto_suspend_after_days != null && daysOverdue >= rule.auto_suspend_after_days && member.status !== 'suspended') {
            suspendIds.push(member.id);
          }
        }
      }

      let queued = 0;
      if (queueRows.length) {
        const { error: insErr } = await supabase.from('notification_queue').insert(queueRows);
        if (insErr) throw insErr;
        queued = queueRows.length;
      }

      let suspended = 0;
      if (suspendIds.length) {
        const uniq = [...new Set(suspendIds)];
        const { error: suspErr } = await supabase
          .from('gym_members')
          .update({ status: 'suspended' } as any)
          .in('id', uniq);
        if (!suspErr) suspended = uniq.length;
      }

      return { queued, suspended };
    },
    onSuccess: (res, orgId) => {
      qc.invalidateQueries({ queryKey: ['notification-queue', orgId] });
      qc.invalidateQueries({ queryKey: ['org-members'] });
      toast.success(`Sweep complete: ${res.queued} queued, ${res.suspended} suspended`);
    },
    onError: (e: any) => toast.error('Sweep failed: ' + e.message),
  });
}

export function useMarkNotificationSent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notification_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-queue'] }),
  });
}
