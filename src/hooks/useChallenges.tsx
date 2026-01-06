import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  target_value: number;
  xp_reward: number;
  start_date: string;
  end_date: string;
}

interface UserChallenge {
  id: string;
  challenge_id: string;
  current_progress: number;
  completed_at: string | null;
  challenge?: Challenge;
}

export const useChallenges = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: challenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ['weekly-challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_challenges')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0]);

      if (error) throw error;
      return data as Challenge[];
    },
  });

  const { data: userChallenges = [], isLoading: userChallengesLoading } = useQuery({
    queryKey: ['user-challenges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_challenges')
        .select(`
          *,
          challenge:weekly_challenges(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data as UserChallenge[];
    },
    enabled: !!user?.id,
  });

  const joinChallenge = useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_challenges')
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          current_progress: 0,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
      toast.success('Challenge joined!');
    },
    onError: () => {
      toast.error('Failed to join challenge');
    },
  });

  const updateProgress = useMutation({
    mutationFn: async ({ challengeId, progress }: { challengeId: string; progress: number }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const challenge = challenges.find(c => c.id === challengeId);
      const isCompleted = challenge && progress >= challenge.target_value;

      const { error } = await supabase
        .from('user_challenges')
        .update({
          current_progress: progress,
          completed_at: isCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId);

      if (error) throw error;

      return { isCompleted, xpReward: challenge?.xp_reward || 0 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
      if (data?.isCompleted) {
        toast.success(`Challenge completed! +${data.xpReward} XP`);
      }
    },
  });

  const getJoinedChallengeIds = () => userChallenges.map(uc => uc.challenge_id);

  return {
    challenges,
    userChallenges,
    isLoading: challengesLoading || userChallengesLoading,
    joinChallenge,
    updateProgress,
    getJoinedChallengeIds,
  };
};
