import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { startOfMonth, subMonths, format } from 'date-fns';

export function useAdminAnalytics() {
  const { user } = useAuth();

  const totalMembers = useQuery({
    queryKey: ['analytics', 'total-members'],
    queryFn: async () => {
      const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const approvedMembers = useQuery({
    queryKey: ['analytics', 'approved-members'],
    queryFn: async () => {
      const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_approved', true);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const pendingMembers = useQuery({
    queryKey: ['analytics', 'pending-members'],
    queryFn: async () => {
      const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).or('is_approved.is.null,is_approved.eq.false');
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const monthlyAttendance = useQuery({
    queryKey: ['analytics', 'monthly-attendance'],
    queryFn: async () => {
      const sixMonthsAgo = format(subMonths(new Date(), 6), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('check_in_time')
        .gte('check_in_time', sixMonthsAgo);
      if (error) throw error;

      const monthly: Record<string, number> = {};
      data?.forEach(log => {
        const month = format(new Date(log.check_in_time), 'MMM');
        monthly[month] = (monthly[month] || 0) + 1;
      });
      return Object.entries(monthly).map(([name, value]) => ({ name, value }));
    },
    enabled: !!user,
  });

  const activeClasses = useQuery({
    queryKey: ['analytics', 'active-classes'],
    queryFn: async () => {
      const { count, error } = await supabase.from('gym_classes').select('*', { count: 'exact', head: true }).eq('is_active', true);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const openTickets = useQuery({
    queryKey: ['analytics', 'open-tickets'],
    queryFn: async () => {
      const { count, error } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const inactiveMembers = useQuery({
    queryKey: ['analytics', 'inactive-members'],
    queryFn: async () => {
      // Get profiles with workouts, find who hasn't worked out in 7+ days
      const sevenDaysAgo = format(subMonths(new Date(), 0.25), 'yyyy-MM-dd');
      const { data: allProfiles, error: pErr } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .eq('is_approved', true);
      if (pErr) throw pErr;

      const { data: recentWorkouts, error: wErr } = await supabase
        .from('workouts')
        .select('user_id, workout_date')
        .gte('workout_date', sevenDaysAgo);
      if (wErr) throw wErr;

      const activeUserIds = new Set(recentWorkouts?.map(w => w.user_id));
      
      // Also check attendance
      const { data: recentAttendance } = await supabase
        .from('attendance_logs')
        .select('member_id, check_in_time')
        .gte('check_in_time', sevenDaysAgo);
      
      // Get gym_members to map member_id to user_id  
      const { data: gymMembers } = await supabase
        .from('gym_members')
        .select('id, user_id');
      
      const memberToUser = new Map(gymMembers?.map(m => [m.id, m.user_id]) || []);
      recentAttendance?.forEach(a => {
        const uid = memberToUser.get(a.member_id);
        if (uid) activeUserIds.add(uid);
      });

      return allProfiles?.filter(p => !activeUserIds.has(p.user_id)).map(p => ({
        user_id: p.user_id,
        name: p.name || 'Unknown',
        avatar_url: p.avatar_url,
      })) || [];
    },
    enabled: !!user,
  });

  return {
    totalMembers: totalMembers.data || 0,
    approvedMembers: approvedMembers.data || 0,
    pendingMembers: pendingMembers.data || 0,
    monthlyAttendance: monthlyAttendance.data || [],
    activeClasses: activeClasses.data || 0,
    openTickets: openTickets.data || 0,
    inactiveMembers: inactiveMembers.data || [],
    isLoading: totalMembers.isLoading,
  };
}
