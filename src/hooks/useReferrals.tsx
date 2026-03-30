import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useReferrals() {
  const { user } = useAuth();

  const { data: referrals, isLoading } = useQuery({
    queryKey: ['referrals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .or(`referrer_id.eq.${user.id},referred_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const myReferrals = referrals?.filter(r => r.referrer_id === user?.id) || [];
  const totalPoints = myReferrals
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + r.reward_points, 0);

  return { referrals, myReferrals, totalPoints, isLoading };
}
