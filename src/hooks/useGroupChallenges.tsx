import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface GroupChallenge {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  target_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  xp_reward: number;
  created_by: string;
  created_at: string;
  teams?: ChallengeTeam[];
}

export interface ChallengeTeam {
  id: string;
  challenge_id: string;
  name: string;
  color: string;
  total_score: number;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  contribution: number;
  joined_at: string;
  profile?: { name: string | null; avatar_url: string | null };
}

export function useGroupChallenges() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const challengesQuery = useQuery({
    queryKey: ['group-challenges'],
    queryFn: async (): Promise<GroupChallenge[]> => {
      const { data: challenges, error } = await supabase
        .from('group_challenges')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch teams for each challenge
      const challengeIds = challenges.map(c => c.id);
      const { data: teams } = await supabase
        .from('challenge_teams')
        .select('*')
        .in('challenge_id', challengeIds);

      // Fetch members for each team
      const teamIds = teams?.map(t => t.id) || [];
      const { data: members } = await supabase
        .from('challenge_team_members')
        .select('*')
        .in('team_id', teamIds);

      // Get profiles for members
      const memberUserIds = [...new Set(members?.map(m => m.user_id) || [])];
      const { data: profiles } = memberUserIds.length
        ? await supabase.from('profiles').select('user_id, name, avatar_url').in('user_id', memberUserIds)
        : { data: [] };

      return challenges.map(c => ({
        ...c,
        teams: teams
          ?.filter(t => t.challenge_id === c.id)
          .map(t => ({
            ...t,
            total_score: Number(t.total_score),
            members: members
              ?.filter(m => m.team_id === t.id)
              .map(m => ({
                ...m,
                contribution: Number(m.contribution),
                profile: profiles?.find(p => p.user_id === m.user_id) || null,
              })),
          })),
      }));
    },
  });

  const joinTeam = useMutation({
    mutationFn: async (teamId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if already in a team for this challenge
      const { data: team } = await supabase
        .from('challenge_teams')
        .select('challenge_id')
        .eq('id', teamId)
        .single();

      if (!team) throw new Error('Team not found');

      const { data: existingTeams } = await supabase
        .from('challenge_teams')
        .select('id')
        .eq('challenge_id', team.challenge_id);

      const existingTeamIds = existingTeams?.map(t => t.id) || [];

      const { data: existingMembership } = await supabase
        .from('challenge_team_members')
        .select('id')
        .eq('user_id', user.id)
        .in('team_id', existingTeamIds)
        .maybeSingle();

      if (existingMembership) throw new Error('Already in a team for this challenge');

      const { error } = await supabase
        .from('challenge_team_members')
        .insert({ team_id: teamId, user_id: user.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-challenges'] });
      toast.success('Joined team!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateContribution = useMutation({
    mutationFn: async ({ teamId, amount }: { teamId: string; amount: number }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data: membership } = await supabase
        .from('challenge_team_members')
        .select('id, contribution')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();

      if (!membership) throw new Error('Not a team member');

      const newContribution = Number(membership.contribution) + amount;

      const { error } = await supabase
        .from('challenge_team_members')
        .update({ contribution: newContribution })
        .eq('id', membership.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-challenges'] });
    },
  });

  // Find which team the user is on
  const getUserTeam = (challenge: GroupChallenge) => {
    if (!user?.id) return null;
    for (const team of challenge.teams || []) {
      if (team.members?.some(m => m.user_id === user.id)) return team;
    }
    return null;
  };

  return {
    challenges: challengesQuery.data || [],
    isLoading: challengesQuery.isLoading,
    joinTeam,
    updateContribution,
    getUserTeam,
  };
}
