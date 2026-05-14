import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Resolves the current member's gym + branding (incl. WhatsApp number)
 * so member-facing UI can offer click-to-chat with the gym owner.
 */
export function useMyGymBranding() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-gym-branding', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data: member } = await supabase
        .from('gym_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!member?.organization_id) return null;

      const [{ data: org }, { data: branding }] = await Promise.all([
        supabase.from('organizations').select('id, name').eq('id', member.organization_id).maybeSingle(),
        supabase.from('organization_branding').select('whatsapp_number, instagram_handle')
          .eq('organization_id', member.organization_id).maybeSingle(),
      ]);

      return {
        organization_id: member.organization_id,
        gym_name: org?.name || 'your gym',
        whatsapp_number: branding?.whatsapp_number || null,
        instagram_handle: branding?.instagram_handle || null,
      };
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}
