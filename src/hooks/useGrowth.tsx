import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  status: string;
  interested_plan_id: string | null;
  notes: string | null;
  follow_up_date: string | null;
  assigned_to: string | null;
  converted_at: string | null;
  created_by: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string | null;
  campaign_type: string;
  discount_percentage: number;
  discount_amount: number;
  applicable_plan_id: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  promo_code: string | null;
  max_redemptions: number | null;
  current_redemptions: number;
  created_by: string;
  created_at: string;
}

// ── Leads ──
export function useLeads() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Lead[];
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (lead: Partial<Lead>) => {
      const { error } = await supabase.from('leads').insert({
        ...lead,
        created_by: user!.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); toast.success('Lead added'); },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { error } = await supabase.from('leads').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); toast.success('Lead updated'); },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); toast.success('Lead removed'); },
    onError: (e) => toast.error(e.message),
  });
}

// ── Campaigns ──
export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Campaign[];
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (campaign: Partial<Campaign>) => {
      const { error } = await supabase.from('campaigns').insert({
        ...campaign,
        created_by: user!.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); toast.success('Campaign created'); },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campaign> & { id: string }) => {
      const { error } = await supabase.from('campaigns').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); toast.success('Campaign updated'); },
    onError: (e) => toast.error(e.message),
  });
}

// ── Growth Stats ──
export function useGrowthStats() {
  const leads = useLeads();
  const campaigns = useCampaigns();

  const stats = (() => {
    const allLeads = leads.data || [];
    const allCampaigns = campaigns.data || [];
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const newLeads = allLeads.filter(l => l.status === 'new').length;
    const contactedLeads = allLeads.filter(l => l.status === 'contacted').length;
    const convertedLeads = allLeads.filter(l => l.status === 'converted').length;
    const lostLeads = allLeads.filter(l => l.status === 'lost').length;

    const monthlyLeads = allLeads.filter(l => {
      const d = new Date(l.created_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    const conversionRate = allLeads.length > 0
      ? ((convertedLeads / allLeads.length) * 100).toFixed(1)
      : '0';

    const activeCampaigns = allCampaigns.filter(c => c.is_active).length;

    const followUpsToday = allLeads.filter(l => {
      if (!l.follow_up_date) return false;
      const fDate = new Date(l.follow_up_date);
      return fDate.toDateString() === now.toDateString() && l.status !== 'converted' && l.status !== 'lost';
    }).length;

    // Lead sources breakdown
    const sourceBreakdown = allLeads.reduce((acc: Record<string, number>, l) => {
      acc[l.source] = (acc[l.source] || 0) + 1;
      return acc;
    }, {});

    // Monthly lead trend (last 6 months)
    const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(thisYear, thisMonth - (5 - i), 1);
      const month = d.toLocaleString('default', { month: 'short' });
      const count = allLeads.filter(l => {
        const ld = new Date(l.created_at);
        return ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear();
      }).length;
      const converted = allLeads.filter(l => {
        if (!l.converted_at) return false;
        const cd = new Date(l.converted_at);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
      }).length;
      return { month, leads: count, converted };
    });

    return {
      newLeads, contactedLeads, convertedLeads, lostLeads,
      monthlyLeads, conversionRate, activeCampaigns, followUpsToday,
      sourceBreakdown, monthlyTrend, totalLeads: allLeads.length,
    };
  })();

  return { stats, isLoading: leads.isLoading || campaigns.isLoading };
}
