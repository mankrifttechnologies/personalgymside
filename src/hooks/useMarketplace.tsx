import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  organization_id: string | null;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  category: string;
  condition: string;
  brand: string | null;
  photos: string[];
  stock: number;
  location: string | null;
  delivery_option: string;
  status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  seller_name?: string;
  seller_avatar?: string;
  organization_name?: string;
}

export const MARKET_CATEGORIES = [
  { value: 'supplements', label: 'Supplements' },
  { value: 'apparel', label: 'Apparel' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'other', label: 'Other' },
];

export const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];

export const DELIVERY_OPTIONS = [
  { value: 'pickup', label: 'Pickup only' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'both', label: 'Pickup or shipping' },
];

export function useMarketplaceListings(filters?: {
  category?: string;
  scope?: 'all' | 'my_gym';
  search?: string;
  myGymOrgId?: string | null;
}) {
  return useQuery({
    queryKey: ['marketplace-listings', filters],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters?.scope === 'my_gym' && filters.myGymOrgId) {
        query = query.eq('organization_id', filters.myGymOrgId);
      }
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }

      const { data: listings, error } = await query.limit(100);
      if (error) throw error;
      if (!listings || listings.length === 0) return [];

      // Fetch seller profiles
      const sellerIds = [...new Set(listings.map((l) => l.seller_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', sellerIds);

      const orgIds = [...new Set(listings.map((l) => l.organization_id).filter(Boolean))] as string[];
      const { data: orgs } = orgIds.length
        ? await supabase.from('organizations').select('id, name').in('id', orgIds)
        : { data: [] };

      return listings.map((l) => {
        const p = profiles?.find((x) => x.user_id === l.seller_id);
        const o = orgs?.find((x) => x.id === l.organization_id);
        return {
          ...l,
          seller_name: p?.name || 'Member',
          seller_avatar: p?.avatar_url || undefined,
          organization_name: o?.name,
        } as MarketplaceListing;
      });
    },
  });
}

export function useMyListings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-marketplace-listings', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as MarketplaceListing[];
    },
  });
}

export function useCreateListing() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string;
      price: number;
      currency?: string;
      category: string;
      condition: string;
      brand?: string;
      photos: string[];
      stock?: number;
      location?: string;
      delivery_option: string;
      organization_id?: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('marketplace_listings')
        .insert({
          seller_id: user.id,
          title: input.title,
          description: input.description || null,
          price: input.price,
          currency: input.currency || 'INR',
          category: input.category,
          condition: input.condition,
          brand: input.brand || null,
          photos: input.photos,
          stock: input.stock ?? 1,
          location: input.location || null,
          delivery_option: input.delivery_option,
          organization_id: input.organization_id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketplace-listings'] });
      qc.invalidateQueries({ queryKey: ['my-marketplace-listings'] });
      toast.success('Listing posted!');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to create listing'),
  });
}

export function useDeleteListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('marketplace_listings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketplace-listings'] });
      qc.invalidateQueries({ queryKey: ['my-marketplace-listings'] });
      toast.success('Listing removed');
    },
  });
}

export function useUpdateListingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'sold' | 'hidden' }) => {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketplace-listings'] });
      qc.invalidateQueries({ queryKey: ['my-marketplace-listings'] });
      toast.success('Updated');
    },
  });
}

export async function uploadMarketplacePhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('marketplace-photos').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('marketplace-photos').getPublicUrl(path);
  return data.publicUrl;
}

export function useMyOrganizationId() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-org-id', user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Try gym_members first
      const { data: gm } = await supabase
        .from('gym_members')
        .select('organization_id')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (gm?.organization_id) return gm.organization_id;
      // Fallback: organization_members
      const { data: om } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (om?.organization_id) return om.organization_id;
      // Fallback: owner
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user!.id)
        .maybeSingle();
      return org?.id || null;
    },
  });
}
