import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  xpReward: number;
}

export const BADGES: Badge[] = [
  { id: 'first_workout', name: 'First Steps', description: 'Complete your first workout', icon: '🎯', condition: 'first_workout', xpReward: 50 },
  { id: 'streak_3', name: 'On Fire', description: '3-day workout streak', icon: '🔥', condition: 'streak_3', xpReward: 100 },
  { id: 'streak_7', name: 'Dedicated', description: '7-day workout streak', icon: '💪', condition: 'streak_7', xpReward: 250 },
  { id: 'streak_30', name: 'Unstoppable', description: '30-day workout streak', icon: '🏆', condition: 'streak_30', xpReward: 1000 },
  { id: 'first_pr', name: 'New Record', description: 'Set your first personal record', icon: '🥇', condition: 'first_pr', xpReward: 75 },
  { id: 'prs_10', name: 'PR Hunter', description: 'Set 10 personal records', icon: '🎖️', condition: 'prs_10', xpReward: 500 },
  { id: 'workouts_10', name: 'Getting Serious', description: 'Complete 10 workouts', icon: '⭐', condition: 'workouts_10', xpReward: 200 },
  { id: 'workouts_50', name: 'Gym Regular', description: 'Complete 50 workouts', icon: '🌟', condition: 'workouts_50', xpReward: 750 },
  { id: 'workouts_100', name: 'Century Club', description: 'Complete 100 workouts', icon: '💯', condition: 'workouts_100', xpReward: 1500 },
  { id: 'calories_7_days', name: 'Nutrition Tracker', description: 'Log calories for 7 consecutive days', icon: '🥗', condition: 'calories_7_days', xpReward: 150 },
  { id: 'water_goal', name: 'Hydration Hero', description: 'Hit your water goal for a week', icon: '💧', condition: 'water_goal', xpReward: 100 },
  { id: 'first_friend', name: 'Social Butterfly', description: 'Add your first friend', icon: '🤝', condition: 'first_friend', xpReward: 50 },
  { id: 'early_bird', name: 'Early Bird', description: 'Complete a workout before 7 AM', icon: '🌅', condition: 'early_bird', xpReward: 75 },
  { id: 'night_owl', name: 'Night Owl', description: 'Complete a workout after 9 PM', icon: '🦉', condition: 'night_owl', xpReward: 75 },
  { id: 'all_muscles', name: 'Full Body', description: 'Train all muscle groups in a week', icon: '🏋️', condition: 'all_muscles', xpReward: 300 },
];

export const useBadges = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: earnedBadges = [], isLoading } = useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const awardBadge = useMutation({
    mutationFn: async (badgeId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      // Check if already earned
      const existing = earnedBadges.find(b => b.badge_id === badgeId);
      if (existing) return null;

      const { data, error } = await supabase
        .from('user_badges')
        .insert({ user_id: user.id, badge_id: badgeId })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') return null; // Already exists
        throw error;
      }

      // Award XP
      const badge = BADGES.find(b => b.id === badgeId);
      if (badge) {
        await supabase
          .from('profiles')
          .update({ 
            xp: (await supabase.from('profiles').select('xp').eq('user_id', user.id).single()).data?.xp + badge.xpReward 
          })
          .eq('user_id', user.id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-badges'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const hasBadge = (badgeId: string) => earnedBadges.some(b => b.badge_id === badgeId);

  const getBadgeDetails = (badgeId: string) => BADGES.find(b => b.id === badgeId);

  return {
    earnedBadges,
    isLoading,
    awardBadge,
    hasBadge,
    getBadgeDetails,
    allBadges: BADGES,
  };
};
