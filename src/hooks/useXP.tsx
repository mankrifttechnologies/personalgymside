import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const XP_PER_LEVEL = 500;

export const calculateLevel = (xp: number): number => {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
};

export const getXPForNextLevel = (currentXP: number): number => {
  const currentLevel = calculateLevel(currentXP);
  return currentLevel * XP_PER_LEVEL;
};

export const getXPProgress = (currentXP: number): number => {
  const currentLevel = calculateLevel(currentXP);
  const xpForCurrentLevel = (currentLevel - 1) * XP_PER_LEVEL;
  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  return (xpInCurrentLevel / XP_PER_LEVEL) * 100;
};

export const useXP = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: xpData, isLoading } = useQuery({
    queryKey: ['user-xp', user?.id],
    queryFn: async () => {
      if (!user) return { xp: 0, level: 1 };
      const { data, error } = await supabase
        .from('profiles')
        .select('xp, level')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return { xp: data?.xp || 0, level: data?.level || 1 };
    },
    enabled: !!user,
  });

  const addXP = useMutation({
    mutationFn: async (amount: number) => {
      if (!user) throw new Error('Not authenticated');
      
      const currentXP = xpData?.xp || 0;
      const newXP = currentXP + amount;
      const newLevel = calculateLevel(newXP);

      const { data, error } = await supabase
        .from('profiles')
        .update({ xp: newXP, level: newLevel })
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return { xp: newXP, level: newLevel, leveledUp: newLevel > (xpData?.level || 1) };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-xp'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const xp = xpData?.xp || 0;
  const level = calculateLevel(xp);
  const progress = getXPProgress(xp);
  const xpToNext = getXPForNextLevel(xp) - xp;

  return {
    xp,
    level,
    progress,
    xpToNext,
    isLoading,
    addXP,
  };
};
