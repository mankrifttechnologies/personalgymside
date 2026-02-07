import { useState, useEffect } from 'react';
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
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return useQuery({
    queryKey: ['member-search', debouncedQuery],
    queryFn: async (): Promise<SearchableMember[]> => {
      // First get all profiles - this ensures we find ALL users, not just gym_members
      let profilesQuery = supabase
        .from('profiles')
        .select('user_id, name, avatar_url, fitness_goal');
      
      // Apply server-side search if query has 2+ characters
      if (debouncedQuery.trim().length >= 2) {
        profilesQuery = profilesQuery.or(`name.ilike.%${debouncedQuery}%`);
      }

      const { data: profiles, error: profilesError } = await profilesQuery.limit(50);
      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        return [];
      }

      // Get gym_members data for matched profiles
      const userIds = profiles.map(p => p.user_id);
      const { data: members } = await supabase
        .from('gym_members')
        .select(`
          id,
          member_code,
          user_id,
          member_streaks(current_streak),
          points_wallet(balance)
        `)
        .in('user_id', userIds)
        .eq('status', 'active');

      // Get attendance counts for these members
      const memberIds = members?.map(m => m.id) || [];
      const { data: attendanceCounts } = await supabase
        .from('attendance_logs')
        .select('member_id')
        .in('member_id', memberIds);

      const attendanceByMember: Record<string, number> = {};
      attendanceCounts?.forEach(log => {
        attendanceByMember[log.member_id] = (attendanceByMember[log.member_id] || 0) + 1;
      });

      // Get workout counts for these users
      const { data: workoutCounts } = await supabase
        .from('workouts')
        .select('user_id')
        .in('user_id', userIds);

      const workoutsByUser: Record<string, number> = {};
      workoutCounts?.forEach(w => {
        workoutsByUser[w.user_id] = (workoutsByUser[w.user_id] || 0) + 1;
      });

      const memberMap = new Map(members?.map(m => [m.user_id, m]) || []);

      // Build searchable members from profiles (primary) with gym_member data (secondary)
      const results: SearchableMember[] = profiles.map(profile => {
        const member = memberMap.get(profile.user_id);
        const streakData = member ? (Array.isArray(member.member_streaks) 
          ? member.member_streaks[0] 
          : member.member_streaks) : null;
        const walletData = member ? (Array.isArray(member.points_wallet)
          ? member.points_wallet[0]
          : member.points_wallet) : null;

        return {
          member_id: member?.id || '',
          user_id: profile.user_id,
          member_code: member?.member_code || 'N/A',
          name: profile.name || null,
          avatar_url: profile.avatar_url || null,
          current_streak: streakData?.current_streak || 0,
          total_attendance_days: member ? (attendanceByMember[member.id] || 0) : 0,
          total_workouts: workoutsByUser[profile.user_id] || 0,
          points_balance: walletData?.balance || 0,
          fitness_goal: profile.fitness_goal || null,
        };
      });

      // Sort by name (with fallback to member_code)
      return results.sort((a, b) => {
        const nameA = a.name || a.member_code || '';
        const nameB = b.name || b.member_code || '';
        return nameA.localeCompare(nameB);
      });
    },
    enabled: true, // Always enable - show all profiles by default, filter when searching
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
