import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { subDays, subMonths, format, getDay, getHours, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

export function useOwnerAnalytics() {
  const { user } = useAuth();

  // Peak hour heatmap data (day x hour)
  const peakHours = useQuery({
    queryKey: ['owner-analytics', 'peak-hours'],
    queryFn: async () => {
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('check_in_time')
        .gte('check_in_time', thirtyDaysAgo);
      if (error) throw error;

      // Build heatmap: 7 days x 24 hours
      const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
      data?.forEach(log => {
        const d = new Date(log.check_in_time);
        const day = getDay(d); // 0=Sun
        const hour = getHours(d);
        heatmap[day][hour]++;
      });

      return heatmap;
    },
    enabled: !!user,
  });

  // Class fill rates
  const classFillRates = useQuery({
    queryKey: ['owner-analytics', 'class-fill-rates'],
    queryFn: async () => {
      const { data: classes, error: cErr } = await supabase
        .from('gym_classes')
        .select('id, title, capacity, class_type')
        .eq('is_active', true);
      if (cErr) throw cErr;

      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const { data: bookings, error: bErr } = await supabase
        .from('class_bookings')
        .select('class_id, booking_date')
        .gte('booking_date', thirtyDaysAgo)
        .eq('status', 'booked');
      if (bErr) throw bErr;

      const bookingCounts: Record<string, number> = {};
      bookings?.forEach(b => {
        bookingCounts[b.class_id] = (bookingCounts[b.class_id] || 0) + 1;
      });

      // 4 weeks of classes
      return (classes || []).map(c => ({
        id: c.id,
        title: c.title,
        capacity: c.capacity,
        type: c.class_type,
        totalBookings: bookingCounts[c.id] || 0,
        fillRate: c.capacity > 0 ? Math.min(((bookingCounts[c.id] || 0) / (c.capacity * 4)) * 100, 100) : 0,
      }));
    },
    enabled: !!user,
  });

  // Member retention (monthly)
  const retention = useQuery({
    queryKey: ['owner-analytics', 'retention'],
    queryFn: async () => {
      const months: { month: string; retained: number; churned: number; rate: number }[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));
        const prevMonthStart = startOfMonth(subMonths(new Date(), i + 1));
        const prevMonthEnd = endOfMonth(subMonths(new Date(), i + 1));

        // Active in previous month (had workout or attendance)
        const { data: prevWorkouts } = await supabase
          .from('workouts')
          .select('user_id')
          .gte('workout_date', format(prevMonthStart, 'yyyy-MM-dd'))
          .lte('workout_date', format(prevMonthEnd, 'yyyy-MM-dd'));

        const prevActive = new Set(prevWorkouts?.map(w => w.user_id) || []);

        // Active in current month
        const { data: currWorkouts } = await supabase
          .from('workouts')
          .select('user_id')
          .gte('workout_date', format(monthStart, 'yyyy-MM-dd'))
          .lte('workout_date', format(monthEnd, 'yyyy-MM-dd'));

        const currActive = new Set(currWorkouts?.map(w => w.user_id) || []);

        const retained = [...prevActive].filter(id => currActive.has(id)).length;
        const churned = prevActive.size - retained;
        const rate = prevActive.size > 0 ? (retained / prevActive.size) * 100 : 100;

        months.push({
          month: format(monthStart, 'MMM'),
          retained,
          churned,
          rate: Math.round(rate),
        });
      }

      return months;
    },
    enabled: !!user,
  });

  // Revenue summary (from reward redemptions as proxy, or membership data)
  const revenue = useQuery({
    queryKey: ['owner-analytics', 'revenue'],
    queryFn: async () => {
      // Count new members per month as revenue proxy
      const { data: members, error } = await supabase
        .from('gym_members')
        .select('joined_at, status');
      if (error) throw error;

      const monthlyNew: Record<string, number> = {};
      const totalActive = members?.filter(m => m.status === 'active').length || 0;
      
      members?.forEach(m => {
        const month = format(new Date(m.joined_at), 'MMM yyyy');
        monthlyNew[month] = (monthlyNew[month] || 0) + 1;
      });

      // Last 6 months
      const recentMonths: { month: string; newMembers: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const key = format(d, 'MMM yyyy');
        recentMonths.push({
          month: format(d, 'MMM'),
          newMembers: monthlyNew[key] || 0,
        });
      }

      return {
        totalActiveMembers: totalActive,
        totalMembers: members?.length || 0,
        monthlyGrowth: recentMonths,
      };
    },
    enabled: !!user,
  });

  return {
    peakHours: peakHours.data || Array.from({ length: 7 }, () => Array(24).fill(0)),
    classFillRates: classFillRates.data || [],
    retention: retention.data || [],
    revenue: revenue.data || { totalActiveMembers: 0, totalMembers: 0, monthlyGrowth: [] },
    isLoading: peakHours.isLoading || classFillRates.isLoading || retention.isLoading || revenue.isLoading,
  };
}
