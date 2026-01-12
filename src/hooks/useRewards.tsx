import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { RewardsCatalog, RewardRedemption } from '@/types/attendance';

export function useRewardsCatalog() {
  return useQuery({
    queryKey: ['rewards-catalog'],
    queryFn: async (): Promise<RewardsCatalog[]> => {
      const { data, error } = await supabase
        .from('rewards_catalog')
        .select('*')
        .eq('is_active', true)
        .order('points_cost');

      if (error) throw error;
      return data || [];
    }
  });
}

export function useMyRedemptions(memberId?: string) {
  return useQuery({
    queryKey: ['my-redemptions', memberId],
    queryFn: async (): Promise<RewardRedemption[]> => {
      if (!memberId) return [];

      const { data, error } = await supabase
        .from('reward_redemptions')
        .select('*, rewards_catalog(*)')
        .eq('member_id', memberId)
        .order('redeemed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!memberId
  });
}

export function useRedeemReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      memberId, 
      rewardId, 
      pointsCost 
    }: { 
      memberId: string; 
      rewardId: string; 
      pointsCost: number;
    }) => {
      // First check wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('points_wallet')
        .select('*')
        .eq('member_id', memberId)
        .single();

      if (walletError) throw walletError;
      if (!wallet) throw new Error('Wallet not found');
      if (wallet.balance < pointsCost) {
        throw new Error('Insufficient points balance');
      }

      // Create redemption
      const { error: redemptionError } = await supabase
        .from('reward_redemptions')
        .insert({
          member_id: memberId,
          reward_id: rewardId,
          points_spent: pointsCost,
          status: 'pending'
        });

      if (redemptionError) throw redemptionError;

      // Deduct points
      const { error: updateError } = await supabase
        .from('points_wallet')
        .update({
          balance: wallet.balance - pointsCost,
          total_spent: wallet.total_spent + pointsCost
        })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      // Record transaction
      await supabase
        .from('points_transactions')
        .insert({
          wallet_id: wallet.id,
          amount: -pointsCost,
          transaction_type: 'redemption',
          description: `Redeemed reward`
        });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['points-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['my-redemptions'] });
      toast.success('Reward redeemed successfully!');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
}
