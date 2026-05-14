import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OrgBranding {
  id: string;
  organization_id: string;
  logo_url: string | null;
  cover_image_url: string | null;
  brand_color: string;
  brand_color_dark: string | null;
  tagline: string | null;
  about: string | null;
  amenities: string[];
  gallery_urls: string[];
  trainer_highlights: any;
  whatsapp_number: string | null;
  instagram_handle: string | null;
  facebook_url: string | null;
  google_maps_url: string | null;
  gst_number: string | null;
  gstin: string | null;
  pan: string | null;
  business_address: string | null;
  state_code: string | null;
  upi_vpa: string | null;
  upi_payee_name: string | null;
  invoice_prefix: string;
  invoice_counter: number;
}

export function useOrgBranding(organizationId?: string) {
  return useQuery({
    queryKey: ['org-branding', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data, error } = await supabase
        .from('organization_branding')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();
      if (error) throw error;
      return data as OrgBranding | null;
    },
    enabled: !!organizationId,
  });
}

export function useUpsertOrgBranding(organizationId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<OrgBranding>) => {
      if (!organizationId) throw new Error('No organization');
      const { data: existing } = await supabase
        .from('organization_branding')
        .select('id')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('organization_branding')
          .update(payload as any)
          .eq('organization_id', organizationId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('organization_branding')
          .insert({ ...(payload as any), organization_id: organizationId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-branding', organizationId] });
      toast.success('Branding saved');
    },
    onError: (e: any) => toast.error('Save failed: ' + e.message),
  });
}

export async function uploadBrandAsset(organizationId: string, file: File, kind: 'logo' | 'cover' | 'gallery') {
  const ext = file.name.split('.').pop();
  const path = `${organizationId}/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('gym-branding').upload(path, file, {
    upsert: true,
    cacheControl: '3600',
  });
  if (error) throw error;
  const { data } = supabase.storage.from('gym-branding').getPublicUrl(path);
  return data.publicUrl;
}
