import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SearchableMember {
  member_id: string;
  user_id: string;
  member_code: string;
  name: string | null;
  avatar_url: string | null;
  current_streak: number;
  total_attendance_days: number;
  total_workouts: number;
  points_balance: number;
  fitness_goal: string | null;
}

export function useMemberSearch(searchQuery: string = '') {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce search input
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return useQuery({
    queryKey: ['member-search', debouncedQuery],
    queryFn: async (): Promise<SearchableMember[]> => {
      // Get all active members
      const { data: members, error: membersError } = await supabase
        .from('gym_members')
        .select(`
          id,
          member_code,
          user_id,
          member_streaks(current_streak),
          points_wallet(balance)
        `)
        .eq('status', 'active');

      if (membersError) throw membersError;

      // Get profiles
      const userIds = members?.map(m => m.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url, fitness_goal')
        .in('user_id', userIds);

      // Get attendance counts
      const { data: attendanceCounts } = await supabase
        .from('attendance_logs')
        .select('member_id');

      const attendanceByMember: Record<string, number> = {};
      attendanceCounts?.forEach(log => {
        attendanceByMember[log.member_id] = (attendanceByMember[log.member_id] || 0) + 1;
      });

      // Get workout counts
      const { data: workoutCounts } = await supabase
        .from('workouts')
        .select('user_id');

      const workoutsByUser: Record<string, number> = {};
      workoutCounts?.forEach(w => {
        workoutsByUser[w.user_id] = (workoutsByUser[w.user_id] || 0) + 1;
      });

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Build searchable members
      let results: SearchableMember[] = (members || []).map(member => {
        const profile = profileMap.get(member.user_id);
        const streakData = Array.isArray(member.member_streaks) 
          ? member.member_streaks[0] 
          : member.member_streaks;
        const walletData = Array.isArray(member.points_wallet)
          ? member.points_wallet[0]
          : member.points_wallet;

        return {
          member_id: member.id,
          user_id: member.user_id,
          member_code: member.member_code,
          name: profile?.name || null,
          avatar_url: profile?.avatar_url || null,
          current_streak: streakData?.current_streak || 0,
          total_attendance_days: attendanceByMember[member.id] || 0,
          total_workouts: workoutsByUser[member.user_id] || 0,
          points_balance: walletData?.balance || 0,
          fitness_goal: profile?.fitness_goal || null,
        };
      });

      // Filter by search query
      if (debouncedQuery.trim()) {
        const query = debouncedQuery.toLowerCase();
        results = results.filter(member => 
          member.name?.toLowerCase().includes(query) ||
          member.member_code.toLowerCase().includes(query)
        );
      }

      // Sort by name
      return results.sort((a, b) => {
        const nameA = a.name || a.member_code;
        const nameB = b.name || b.member_code;
        return nameA.localeCompare(nameB);
      });
    }
  });
}

export function useMemberProfile(memberId: string | null) {
  return useQuery({
    queryKey: ['member-profile', memberId],
    queryFn: async () => {
      if (!memberId) return null;

      // Get member details
      const { data: member, error } = await supabase
        .from('gym_members')
        .select(`
          id,
          member_code,
          user_id,
          joined_at,
          batch,
          member_streaks(current_streak, longest_streak, last_attendance_date),
          points_wallet(balance, total_earned),
          member_badges(badge_name, badge_type, earned_at)
        `)
        .eq('id', memberId)
        .single();

      if (error) throw error;

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', member.user_id)
        .single();

      // Get attendance logs
      const { data: attendanceLogs } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('member_id', memberId)
        .order('check_in_time', { ascending: false })
        .limit(30);

      // Get workout count
      const { data: workouts } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', member.user_id);

      const streakData = Array.isArray(member.member_streaks) 
        ? member.member_streaks[0] 
        : member.member_streaks;
      const walletData = Array.isArray(member.points_wallet)
        ? member.points_wallet[0]
        : member.points_wallet;
      const badges = member.member_badges || [];

      return {
        member_id: member.id,
        member_code: member.member_code,
        user_id: member.user_id,
        joined_at: member.joined_at,
        batch: member.batch,
        profile: profile,
        current_streak: streakData?.current_streak || 0,
        longest_streak: streakData?.longest_streak || 0,
        last_attendance_date: streakData?.last_attendance_date || null,
        points_balance: walletData?.balance || 0,
        total_points_earned: walletData?.total_earned || 0,
        badges: badges,
        attendance_logs: attendanceLogs || [],
        total_workouts: workouts?.length || 0,
        total_attendance_days: attendanceLogs?.length || 0,
      };
    },
    enabled: !!memberId
  });
}
