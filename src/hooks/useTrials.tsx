import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Trial {
  id: string;
  organization_id: string;
  member_id: string | null;
  lead_id: string | null;
  prospect_name: string;
  prospect_phone: string | null;
  start_date: string;
  end_date: string;
  status: 'active' | 'converted' | 'lost';
  plan_id: string | null;
  notes: string | null;
  converted_at: string | null;
  converted_payment_id: string | null;
  created_at: string;
}

export function useTrials(organizationId?: string) {
  return useQuery({
    queryKey: ['trials', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('trials' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .order('end_date', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Trial[];
    },
    enabled: !!organizationId,
  });
}

export function useCreateTrial() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      organization_id: string;
      prospect_name: string;
      prospect_phone?: string;
      duration_days: number;
      plan_id?: string;
      notes?: string;
    }) => {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + input.duration_days);
      const { error } = await supabase.from('trials' as any).insert({
        organization_id: input.organization_id,
        prospect_name: input.prospect_name,
        prospect_phone: input.prospect_phone || null,
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        status: 'active',
        plan_id: input.plan_id || null,
        notes: input.notes || null,
        created_by: user!.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['trials', vars.organization_id] });
      toast.success('Trial started');
    },
    onError: (e: any) => toast.error('Failed: ' + e.message),
  });
}

export function useUpdateTrialStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Trial['status'] }) => {
      const updates: any = { status };
      if (status === 'converted') updates.converted_at = new Date().toISOString();
      const { error } = await supabase.from('trials' as any).update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trials'] });
      toast.success('Trial updated');
    },
    onError: (e: any) => toast.error('Failed: ' + e.message),
  });
}

export function useDeleteTrial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('trials' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trials'] });
      toast.success('Trial removed');
    },
  });
}
