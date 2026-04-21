import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LandingPlan {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  price: number;
  duration_label: string;
  features: string[];
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
}

export function useGymLandingPlans(organizationId?: string, activeOnly = false) {
  return useQuery({
    queryKey: ['landing-plans', organizationId, activeOnly],
    queryFn: async () => {
      if (!organizationId) return [];
      let q = supabase
        .from('gym_landing_plans')
        .select('*')
        .eq('organization_id', organizationId)
        .order('display_order', { ascending: true });
      if (activeOnly) q = q.eq('is_active', true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as LandingPlan[];
    },
    enabled: !!organizationId,
  });
}

export function useSaveLandingPlan(organizationId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: Partial<LandingPlan> & { id?: string }) => {
      if (!organizationId) throw new Error('No organization');
      if (plan.id) {
        const { error } = await supabase
          .from('gym_landing_plans')
          .update(plan as any)
          .eq('id', plan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('gym_landing_plans')
          .insert({ ...(plan as any), organization_id: organizationId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landing-plans', organizationId] });
      toast.success('Plan saved');
    },
    onError: (e: any) => toast.error('Save failed: ' + e.message),
  });
}

export function useDeleteLandingPlan(organizationId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gym_landing_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landing-plans', organizationId] });
      toast.success('Plan deleted');
    },
  });
}
