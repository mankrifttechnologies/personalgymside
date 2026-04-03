import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { subDays, format, addMonths } from 'date-fns';

export function useChurnRisk() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['advanced-analytics', 'churn-risk'],
    queryFn: async () => {
      // Get all approved members with profiles
      const { data: members } = await supabase
        .from('gym_members')
        .select('id, user_id, joined_at, status')
        .eq('status', 'active');

      if (!members?.length) return [];

      const userIds = members.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url, tier')
        .in('user_id', userIds);

      // Get recent attendance (last 30 days)
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data: recentAttendance } = await supabase
        .from('attendance_logs')
        .select('member_id, check_in_time')
        .gte('check_in_time', thirtyDaysAgo);

      // Get payment status
      const { data: payments } = await supabase
        .from('payment_records')
        .select('member_id, status, due_date')
        .in('status', ['pending', 'overdue']);

      const attendanceMap = new Map<string, number>();
      recentAttendance?.forEach(a => {
        attendanceMap.set(a.member_id, (attendanceMap.get(a.member_id) || 0) + 1);
      });

      const overdueMap = new Set(payments?.filter(p => p.status === 'overdue').map(p => p.member_id) || []);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return members.map(m => {
        const visits = attendanceMap.get(m.id) || 0;
        const hasOverdue = overdueMap.has(m.id);
        const profile = profileMap.get(m.user_id);

        // Risk scoring
        let riskScore = 0;
        if (visits === 0) riskScore += 50;
        else if (visits < 4) riskScore += 30;
        else if (visits < 8) riskScore += 10;
        if (hasOverdue) riskScore += 30;
        // Newer members get slight bump (might just be getting started)
        const daysSinceJoin = Math.floor((Date.now() - new Date(m.joined_at).getTime()) / 86400000);
        if (daysSinceJoin > 90 && visits < 4) riskScore += 20;

        const riskLevel = riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low';

        return {
          memberId: m.id,
          userId: m.user_id,
          name: profile?.name || 'Unknown',
          avatar: profile?.avatar_url,
          tier: profile?.tier || 'bronze',
          visits30d: visits,
          hasOverduePayment: hasOverdue,
          riskScore,
          riskLevel,
        };
      }).sort((a, b) => b.riskScore - a.riskScore);
    },
    enabled: !!user,
  });
}

export function useRevenueForecast() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['advanced-analytics', 'revenue-forecast'],
    queryFn: async () => {
      // Get last 6 months of payments
      const sixMonthsAgo = subDays(new Date(), 180).toISOString();
      const { data: payments } = await supabase
        .from('payment_records')
        .select('amount, payment_date, status, currency')
        .eq('status', 'paid')
        .gte('payment_date', sixMonthsAgo.split('T')[0]);

      // Group by month
      const monthlyRevenue = new Map<string, number>();
      payments?.forEach(p => {
        const month = format(new Date(p.payment_date), 'yyyy-MM');
        monthlyRevenue.set(month, (monthlyRevenue.get(month) || 0) + Number(p.amount));
      });

      const sortedMonths = [...monthlyRevenue.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      const avgMonthly = sortedMonths.length > 0
        ? sortedMonths.reduce((s, [, v]) => s + v, 0) / sortedMonths.length
        : 0;

      // Trend: compare last 2 months
      const trend = sortedMonths.length >= 2
        ? (sortedMonths[sortedMonths.length - 1][1] - sortedMonths[sortedMonths.length - 2][1]) / (sortedMonths[sortedMonths.length - 2][1] || 1)
        : 0;

      const growthFactor = 1 + (trend * 0.5); // dampened trend

      // Active members count for baseline
      const { count: activeMembers } = await supabase
        .from('gym_members')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      // Project next 3 months
      const projections = [];
      for (let i = 1; i <= 3; i++) {
        const month = format(addMonths(new Date(), i), 'yyyy-MM');
        const projected = avgMonthly * Math.pow(growthFactor, i);
        projections.push({ month, projected: Math.round(projected) });
      }

      const historical = sortedMonths.map(([month, actual]) => ({
        month,
        actual,
        projected: null as number | null,
      }));

      const forecast = projections.map(p => ({
        month: p.month,
        actual: null as number | null,
        projected: p.projected,
      }));

      return {
        chartData: [...historical, ...forecast],
        avgMonthly: Math.round(avgMonthly),
        trend: Math.round(trend * 100),
        activeMembers: activeMembers || 0,
        currency: payments?.[0]?.currency || 'INR',
      };
    },
    enabled: !!user,
  });
}

export function useMemberSegmentation() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['advanced-analytics', 'segmentation'],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, tier, fitness_goal, gender, age, is_approved')
        .eq('is_approved', true);

      if (!profiles?.length) return { byTier: [], byGoal: [], byGender: [], byAge: [] };

      const count = (arr: any[], key: string) => {
        const map = new Map<string, number>();
        arr.forEach(item => {
          const val = item[key] || 'Unknown';
          map.set(val, (map.get(val) || 0) + 1);
        });
        return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
      };

      const byAge = (() => {
        const buckets = { '< 20': 0, '20-29': 0, '30-39': 0, '40-49': 0, '50+': 0, 'Unknown': 0 };
        profiles.forEach(p => {
          if (!p.age) buckets['Unknown']++;
          else if (p.age < 20) buckets['< 20']++;
          else if (p.age < 30) buckets['20-29']++;
          else if (p.age < 40) buckets['30-39']++;
          else if (p.age < 50) buckets['40-49']++;
          else buckets['50+']++;
        });
        return Object.entries(buckets).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
      })();

      return {
        byTier: count(profiles, 'tier'),
        byGoal: count(profiles, 'fitness_goal'),
        byGender: count(profiles, 'gender'),
        byAge,
        total: profiles.length,
      };
    },
    enabled: !!user,
  });
}

export function useCustomReport() {
  const { user } = useAuth();

  const generateReport = async (source: string, dateFrom: string, dateTo: string) => {
    let data: any[] = [];
    let columns: string[] = [];

    switch (source) {
      case 'members': {
        const { data: members } = await supabase
          .from('profiles')
          .select('name, tier, fitness_goal, gender, age, is_approved, created_at')
          .gte('created_at', dateFrom)
          .lte('created_at', dateTo);
        data = members || [];
        columns = ['name', 'tier', 'fitness_goal', 'gender', 'age', 'is_approved', 'created_at'];
        break;
      }
      case 'payments': {
        const { data: payments } = await supabase
          .from('payment_records')
          .select('amount, currency, status, payment_date, payment_method, invoice_number')
          .gte('payment_date', dateFrom.split('T')[0])
          .lte('payment_date', dateTo.split('T')[0]);
        data = payments || [];
        columns = ['amount', 'currency', 'status', 'payment_date', 'payment_method', 'invoice_number'];
        break;
      }
      case 'attendance': {
        const { data: logs } = await supabase
          .from('attendance_logs')
          .select('member_id, check_in_time, check_out_time, duration_minutes, status, is_on_time')
          .gte('check_in_time', dateFrom)
          .lte('check_in_time', dateTo);
        data = logs || [];
        columns = ['member_id', 'check_in_time', 'check_out_time', 'duration_minutes', 'status', 'is_on_time'];
        break;
      }
      case 'workouts': {
        const { data: workouts } = await supabase
          .from('workouts')
          .select('user_id, workout_date, total_duration_minutes, calories_burned, notes')
          .gte('workout_date', dateFrom.split('T')[0])
          .lte('workout_date', dateTo.split('T')[0]);
        data = workouts || [];
        columns = ['user_id', 'workout_date', 'total_duration_minutes', 'calories_burned', 'notes'];
        break;
      }
    }

    return { data, columns };
  };

  return { generateReport };
}
