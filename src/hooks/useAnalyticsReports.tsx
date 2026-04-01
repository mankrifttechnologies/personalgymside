import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, subMonths, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

export function useMemberDemographics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['analytics', 'demographics'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('gender, age, fitness_goal, activity_level, tier');
      if (error) throw error;

      const genderDist: Record<string, number> = {};
      const goalDist: Record<string, number> = {};
      const ageBuckets: Record<string, number> = { '< 18': 0, '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '55+': 0 };
      const tierDist: Record<string, number> = {};

      profiles?.forEach(p => {
        const g = p.gender || 'Unknown';
        genderDist[g] = (genderDist[g] || 0) + 1;

        const goal = p.fitness_goal || 'Not Set';
        goalDist[goal] = (goalDist[goal] || 0) + 1;

        const tier = p.tier || 'bronze';
        tierDist[tier] = (tierDist[tier] || 0) + 1;

        if (p.age) {
          if (p.age < 18) ageBuckets['< 18']++;
          else if (p.age <= 25) ageBuckets['18-25']++;
          else if (p.age <= 35) ageBuckets['26-35']++;
          else if (p.age <= 45) ageBuckets['36-45']++;
          else if (p.age <= 55) ageBuckets['46-55']++;
          else ageBuckets['55+']++;
        }
      });

      return {
        gender: Object.entries(genderDist).map(([name, value]) => ({ name, value })),
        goals: Object.entries(goalDist).map(([name, value]) => ({ name, value })),
        age: Object.entries(ageBuckets).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })),
        tiers: Object.entries(tierDist).map(([name, value]) => ({ name, value })),
        total: profiles?.length || 0,
      };
    },
    enabled: !!user,
  });
}

export function usePlanDistribution() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['analytics', 'plan-distribution'],
    queryFn: async () => {
      const { data: plans } = await supabase.from('membership_plans').select('id, name, price');
      const { data: payments } = await supabase
        .from('payment_records')
        .select('plan_id, amount')
        .eq('status', 'paid');

      const planMap = new Map(plans?.map(p => [p.id, p.name]) || []);
      const dist: Record<string, { count: number; revenue: number }> = {};

      payments?.forEach(p => {
        const name = planMap.get(p.plan_id || '') || 'Other';
        if (!dist[name]) dist[name] = { count: 0, revenue: 0 };
        dist[name].count++;
        dist[name].revenue += Number(p.amount);
      });

      return Object.entries(dist).map(([name, { count, revenue }]) => ({ name, count, revenue }));
    },
    enabled: !!user,
  });
}

type Period = 'monthly' | 'quarterly' | 'yearly';

export function useTaxSummary(period: Period = 'monthly') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['analytics', 'tax-summary', period],
    queryFn: async () => {
      const now = new Date();
      let start: Date, end: Date;

      if (period === 'monthly') {
        start = startOfMonth(now);
        end = endOfMonth(now);
      } else if (period === 'quarterly') {
        start = startOfQuarter(now);
        end = endOfQuarter(now);
      } else {
        start = startOfYear(now);
        end = endOfYear(now);
      }

      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      const { data: payments } = await supabase
        .from('payment_records')
        .select('amount')
        .eq('status', 'paid')
        .gte('payment_date', startStr)
        .lte('payment_date', endStr);

      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', startStr)
        .lte('expense_date', endStr);

      const totalRevenue = payments?.reduce((s, p) => s + Number(p.amount), 0) || 0;
      const totalExpenses = expenses?.reduce((s, e) => s + Number(e.amount), 0) || 0;
      const netProfit = totalRevenue - totalExpenses;
      const gst18 = totalRevenue * 0.18;

      return { totalRevenue, totalExpenses, netProfit, gst18, period };
    },
    enabled: !!user,
  });
}

export function useReportData() {
  const { user } = useAuth();

  const generateMemberReport = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('name, user_id, gender, age, fitness_goal, tier, is_approved, created_at');

    if (!profiles) return '';

    const headers = ['Name', 'Gender', 'Age', 'Goal', 'Tier', 'Approved', 'Joined'];
    const rows = profiles.map(p => [
      p.name || 'N/A',
      p.gender || 'N/A',
      p.age?.toString() || 'N/A',
      p.fitness_goal || 'N/A',
      p.tier || 'bronze',
      p.is_approved ? 'Yes' : 'No',
      p.created_at ? format(new Date(p.created_at), 'yyyy-MM-dd') : 'N/A',
    ]);

    return [headers, ...rows].map(r => r.join(',')).join('\n');
  };

  const generateRevenueReport = async () => {
    const { data: payments } = await supabase
      .from('payment_records')
      .select('amount, payment_date, status, payment_method, invoice_number, currency')
      .order('payment_date', { ascending: false });

    if (!payments) return '';

    const headers = ['Date', 'Amount', 'Currency', 'Status', 'Method', 'Invoice'];
    const rows = payments.map(p => [
      p.payment_date,
      p.amount.toString(),
      p.currency,
      p.status,
      p.payment_method || 'N/A',
      p.invoice_number || 'N/A',
    ]);

    return [headers, ...rows].map(r => r.join(',')).join('\n');
  };

  const generateExpenseReport = async () => {
    const { data: expenses } = await supabase
      .from('expenses')
      .select('title, amount, category, expense_date, currency, is_recurring, notes')
      .order('expense_date', { ascending: false });

    if (!expenses) return '';

    const headers = ['Title', 'Amount', 'Currency', 'Category', 'Date', 'Recurring', 'Notes'];
    const rows = expenses.map(e => [
      e.title,
      e.amount.toString(),
      e.currency,
      e.category,
      e.expense_date,
      e.is_recurring ? 'Yes' : 'No',
      (e.notes || '').replace(/,/g, ';'),
    ]);

    return [headers, ...rows].map(r => r.join(',')).join('\n');
  };

  const generateAttendanceReport = async () => {
    const { data: logs } = await supabase
      .from('attendance_logs')
      .select('member_id, check_in_time, check_out_time, duration_minutes, status, is_on_time')
      .order('check_in_time', { ascending: false })
      .limit(500);

    if (!logs) return '';

    const headers = ['Member ID', 'Check In', 'Check Out', 'Duration (min)', 'Status', 'On Time'];
    const rows = logs.map(l => [
      l.member_id.slice(0, 8),
      format(new Date(l.check_in_time), 'yyyy-MM-dd HH:mm'),
      l.check_out_time ? format(new Date(l.check_out_time), 'yyyy-MM-dd HH:mm') : 'N/A',
      l.duration_minutes?.toString() || 'N/A',
      l.status,
      l.is_on_time ? 'Yes' : 'No',
    ]);

    return [headers, ...rows].map(r => r.join(',')).join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return { generateMemberReport, generateRevenueReport, generateExpenseReport, generateAttendanceReport, downloadCSV };
}
