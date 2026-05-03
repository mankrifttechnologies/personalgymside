import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface MemberVerificationInfo {
  hasGymMembership: boolean;
  isVerified: boolean;
  organizationId: string | null;
  organizationName: string | null;
}

/**
 * Returns the verification status for the current user as a gym member.
 * - hasGymMembership=false  -> user is not linked to any gym yet (or is staff/owner)
 * - isVerified=false        -> they self-registered and are awaiting owner approval
 *
 * While `isVerified` is false, gym-restricted features (attendance, classes,
 * PT bookings, paid services) should be locked.
 */
export function useMemberVerification() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['member-verification', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<MemberVerificationInfo> => {
      if (!user?.id) {
        return {
          hasGymMembership: false,
          isVerified: true,
          organizationId: null,
          organizationName: null,
        };
      }

      const { data: gm } = await supabase
        .from('gym_members')
        .select('id, organization_id, is_verified')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!gm) {
        return {
          hasGymMembership: false,
          isVerified: true,
          organizationId: null,
          organizationName: null,
        };
      }

      let orgName: string | null = null;
      if (gm.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', gm.organization_id)
          .maybeSingle();
        orgName = org?.name ?? null;
      }

      return {
        hasGymMembership: true,
        isVerified: !!(gm as any).is_verified,
        organizationId: gm.organization_id,
        organizationName: orgName,
      };
    },
  });
}

/** Convenience: true while owner has not yet approved this self-registered member. */
export function useIsPendingVerification() {
  const { data, isLoading } = useMemberVerification();
  return {
    isPending: !!data?.hasGymMembership && data.isVerified === false,
    organizationName: data?.organizationName ?? null,
    isLoading,
  };
}
