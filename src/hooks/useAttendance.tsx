import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { 
  GymMember, 
  AttendanceLog, 
  MemberStreak, 
  PointsWallet, 
  MemberBadge,
  BiometricInput,
  AttendanceStats
} from '@/types/attendance';

export function useGymMember() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['gym-member', user?.id],
    queryFn: async (): Promise<GymMember | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('gym_members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });
}

export function useCreateGymMember() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { batch?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data: member, error } = await supabase
        .from('gym_members')
        .insert({
          user_id: user.id,
          member_code: `FIT${Math.floor(10000 + Math.random() * 90000)}`,
          batch: data.batch || null
        })
        .select()
        .single();

      if (error) throw error;
      return member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-member'] });
      toast.success('Gym membership activated!');
    },
    onError: (error) => {
      toast.error('Failed to create membership: ' + error.message);
    }
  });
}

export function useAttendanceLogs(memberId?: string, dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['attendance-logs', memberId, dateRange],
    queryFn: async (): Promise<AttendanceLog[]> => {
      let query = supabase
        .from('attendance_logs')
        .select('*, gym_members(member_code, user_id)')
        .order('check_in_time', { ascending: false });

      if (memberId) {
        query = query.eq('member_id', memberId);
      }

      if (dateRange) {
        query = query
          .gte('check_in_time', dateRange.start)
          .lte('check_in_time', dateRange.end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!memberId || !memberId
  });
}

export function useMemberStreak(memberId?: string) {
  return useQuery({
    queryKey: ['member-streak', memberId],
    queryFn: async (): Promise<MemberStreak | null> => {
      if (!memberId) return null;

      const { data, error } = await supabase
        .from('member_streaks')
        .select('*')
        .eq('member_id', memberId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!memberId
  });
}

export function usePointsWallet(memberId?: string) {
  return useQuery({
    queryKey: ['points-wallet', memberId],
    queryFn: async (): Promise<PointsWallet | null> => {
      if (!memberId) return null;

      const { data, error } = await supabase
        .from('points_wallet')
        .select('*')
        .eq('member_id', memberId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!memberId
  });
}

export function usePointsTransactions(walletId?: string) {
  return useQuery({
    queryKey: ['points-transactions', walletId],
    queryFn: async () => {
      if (!walletId) return [];

      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!walletId
  });
}

export function useMemberBadges(memberId?: string) {
  return useQuery({
    queryKey: ['member-badges', memberId],
    queryFn: async (): Promise<MemberBadge[]> => {
      if (!memberId) return [];

      const { data, error } = await supabase
        .from('member_badges')
        .select('*')
        .eq('member_id', memberId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(b => ({ ...b, metadata: b.metadata as Record<string, any> | null }));
    },
    enabled: !!memberId
  });
}

export function useProcessAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BiometricInput) => {
      const { data, error } = await supabase.functions.invoke('process-attendance', {
        body: input
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-logs'] });
      queryClient.invalidateQueries({ queryKey: ['member-streak'] });
      queryClient.invalidateQueries({ queryKey: ['points-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['member-badges'] });
      
      toast.success(data.message);
      
      if (data.pointsAwarded) {
        toast.info(`+${data.pointsAwarded} points earned!`);
      }
      
      if (data.badgeEarned) {
        toast.success(`🏆 New badge earned: ${data.badgeEarned}!`);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
}

export function useAttendanceStats(memberId?: string): AttendanceStats | null {
  const { data: logs } = useAttendanceLogs(memberId);

  if (!logs || logs.length === 0) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const thisMonthLogs = logs.filter(log => new Date(log.check_in_time) >= startOfMonth);
  const thisWeekLogs = logs.filter(log => new Date(log.check_in_time) >= startOfWeek);
  
  const durations = logs
    .filter(log => log.duration_minutes)
    .map(log => log.duration_minutes!);
  
  const averageDuration = durations.length > 0 
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  const onTimeLogs = logs.filter(log => log.is_on_time);
  const onTimePercentage = Math.round((onTimeLogs.length / logs.length) * 100);

  // Calculate peak hour
  const hourCounts: Record<number, number> = {};
  logs.forEach(log => {
    const hour = new Date(log.check_in_time).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const peakHour = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 0;

  return {
    totalDays: logs.length,
    thisMonth: thisMonthLogs.length,
    thisWeek: thisWeekLogs.length,
    averageDuration,
    onTimePercentage,
    peakHour: parseInt(peakHour as string)
  };
}

export function useAllGymMembers() {
  return useQuery({
    queryKey: ['all-gym-members'],
    queryFn: async (): Promise<GymMember[]> => {
      const { data, error } = await supabase
        .from('gym_members')
        .select('*')
        .eq('status', 'active')
        .order('member_code');

      if (error) throw error;
      return data || [];
    }
  });
}

export function useBiometricDevices() {
  return useQuery({
    queryKey: ['biometric-devices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('biometric_devices')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;
      return data || [];
    }
  });
}
