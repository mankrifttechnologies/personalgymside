import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Types
export interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  duration_days: number;
  price: number;
  currency: string;
  features: string[];
  is_active: boolean;
  plan_type: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  member_id: string;
  plan_id: string | null;
  amount: number;
  currency: string;
  payment_method: string;
  payment_date: string;
  due_date: string | null;
  status: string;
  invoice_number: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  member_name?: string;
  plan_name?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  expense_date: string;
  is_recurring: boolean;
  recurring_interval: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

// ── Membership Plans ──
export function useMembershipPlans() {
  return useQuery({
    queryKey: ['membership-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .order('price', { ascending: true });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : [],
      })) as MembershipPlan[];
    },
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (plan: Partial<MembershipPlan>) => {
      const { error } = await supabase.from('membership_plans').insert({
        ...plan,
        created_by: user!.id,
        features: plan.features || [],
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['membership-plans'] }); toast.success('Plan created'); },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MembershipPlan> & { id: string }) => {
      const { error } = await supabase.from('membership_plans').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['membership-plans'] }); toast.success('Plan updated'); },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('membership_plans').update({ is_active: false } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['membership-plans'] }); toast.success('Plan deactivated'); },
    onError: (e) => toast.error(e.message),
  });
}

// ── Payment Records ──
export function usePaymentRecords() {
  return useQuery({
    queryKey: ['payment-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_records')
        .select('*')
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return (data || []) as PaymentRecord[];
    },
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payment: Partial<PaymentRecord>) => {
      const invoiceNum = `INV-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from('payment_records').insert({
        ...payment,
        created_by: user!.id,
        invoice_number: invoiceNum,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payment-records'] }); toast.success('Payment recorded'); },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PaymentRecord> & { id: string }) => {
      const { error } = await supabase.from('payment_records').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payment-records'] }); toast.success('Payment updated'); },
    onError: (e) => toast.error(e.message),
  });
}

// ── Expenses ──
export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return (data || []) as Expense[];
    },
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (expense: Partial<Expense>) => {
      const { error } = await supabase.from('expenses').insert({
        ...expense,
        created_by: user!.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Expense added'); },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Expense deleted'); },
    onError: (e) => toast.error(e.message),
  });
}

// ── Revenue Stats ──
export function useRevenueStats() {
  const payments = usePaymentRecords();
  const expenses = useExpenses();

  const stats = (() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const allPayments = payments.data || [];
    const allExpenses = expenses.data || [];

    const monthlyRevenue = allPayments
      .filter(p => {
        const d = new Date(p.payment_date);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear && p.status === 'paid';
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const monthlyExpenses = allExpenses
      .filter(e => {
        const d = new Date(e.expense_date);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const totalRevenue = allPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalExpenses = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const overduePayments = allPayments.filter(
      p => p.status === 'pending' && p.due_date && new Date(p.due_date) < now
    );

    // Last 6 months revenue/expense chart data
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(thisYear, thisMonth - (5 - i), 1);
      const month = d.toLocaleString('default', { month: 'short' });
      const mRevenue = allPayments
        .filter(p => {
          const pd = new Date(p.payment_date);
          return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear() && p.status === 'paid';
        })
        .reduce((s, p) => s + Number(p.amount), 0);
      const mExpense = allExpenses
        .filter(e => {
          const ed = new Date(e.expense_date);
          return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
        })
        .reduce((s, e) => s + Number(e.amount), 0);
      return { month, revenue: mRevenue, expenses: mExpense, profit: mRevenue - mExpense };
    });

    // Expense by category
    const expenseByCategory = allExpenses.reduce((acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {});

    return {
      monthlyRevenue,
      monthlyExpenses,
      monthlyProfit: monthlyRevenue - monthlyExpenses,
      totalRevenue,
      totalExpenses,
      totalProfit: totalRevenue - totalExpenses,
      overduePayments,
      overdueCount: overduePayments.length,
      monthlyData,
      expenseByCategory,
    };
  })();

  return {
    stats,
    isLoading: payments.isLoading || expenses.isLoading,
  };
}
