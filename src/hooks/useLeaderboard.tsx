import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LeaderboardEntry } from '@/types/attendance';

export type LeaderboardType = 'streak' | 'attendance' | 'points';
export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all-time';

export function useLeaderboard(type: LeaderboardType = 'streak', limit: number = 50) {
  return useQuery({
    queryKey: ['leaderboard', type, limit],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      // Get all members with their streaks and wallets
      const { data: members, error: membersError } = await supabase
        .from('gym_members')
        .select(`
          id,
          member_code,
          user_id,
          member_streaks(current_streak, longest_streak),
          points_wallet(balance)
        `)
        .eq('status', 'active');

      if (membersError) throw membersError;

      // Get attendance counts
      const { data: attendanceCounts, error: attendanceError } = await supabase
        .from('attendance_logs')
        .select('member_id');

      if (attendanceError) throw attendanceError;

      // Count attendance per member
      const attendanceByMember: Record<string, number> = {};
      attendanceCounts?.forEach(log => {
        attendanceByMember[log.member_id] = (attendanceByMember[log.member_id] || 0) + 1;
      });

      // Get profiles for names
      const userIds = members?.map(m => m.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Build leaderboard entries
      const entries: LeaderboardEntry[] = (members || []).map(member => {
        const profile = profileMap.get(member.user_id);
        const streakData = Array.isArray(member.member_streaks) 
          ? member.member_streaks[0] 
          : member.member_streaks;
        const walletData = Array.isArray(member.points_wallet)
          ? member.points_wallet[0]
          : member.points_wallet;

        return {
          member_id: member.id,
          member_code: member.member_code,
          name: profile?.name || member.member_code,
          avatar_url: profile?.avatar_url || null,
          current_streak: streakData?.current_streak || 0,
          longest_streak: streakData?.longest_streak || 0,
          total_attendance_days: attendanceByMember[member.id] || 0,
          points_balance: walletData?.balance || 0,
          rank: 0
        };
      });

      // Sort based on type
      let sorted: LeaderboardEntry[];
      switch (type) {
        case 'streak':
          sorted = entries.sort((a, b) => b.current_streak - a.current_streak);
          break;
        case 'attendance':
          sorted = entries.sort((a, b) => b.total_attendance_days - a.total_attendance_days);
          break;
        case 'points':
          sorted = entries.sort((a, b) => b.points_balance - a.points_balance);
          break;
        default:
          sorted = entries;
      }

      // Assign ranks
      return sorted.slice(0, limit).map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
    }
  });
}

export function useMyRank(memberId?: string, type: LeaderboardType = 'streak') {
  const { data: leaderboard } = useLeaderboard(type, 1000);

  if (!memberId || !leaderboard) return null;

  const myEntry = leaderboard.find(entry => entry.member_id === memberId);
  return myEntry?.rank || null;
}
