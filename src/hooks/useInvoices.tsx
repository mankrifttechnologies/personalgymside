import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Invoice {
  id: string;
  organization_id: string;
  member_id: string;
  payment_record_id: string | null;
  invoice_number: string;
  invoice_date: string;
  plan_name: string;
  base_amount: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  total_amount: number;
  currency: string;
  payment_method: string | null;
  upi_vpa: string | null;
  status: string;
  notes: string | null;
  pdf_url: string | null;
  created_at: string;
}

export function useInvoices(organizationId?: string) {
  return useQuery({
    queryKey: ['invoices', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Invoice[];
    },
    enabled: !!organizationId,
  });
}

export interface CreateInvoiceInput {
  organization_id: string;
  member_id: string;
  plan_name: string;
  total_amount: number;
  cgst_rate?: number;
  sgst_rate?: number;
  payment_method?: string;
  upi_vpa?: string | null;
  notes?: string;
  status?: string;
  payment_record_id?: string | null;
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: CreateInvoiceInput) => {
      const cgstRate = input.cgst_rate ?? 9;
      const sgstRate = input.sgst_rate ?? 9;
      const totalRate = cgstRate + sgstRate;
      const baseAmount = +(input.total_amount / (1 + totalRate / 100)).toFixed(2);
      const cgstAmount = +(baseAmount * cgstRate / 100).toFixed(2);
      const sgstAmount = +(baseAmount * sgstRate / 100).toFixed(2);

      const { data, error } = await supabase.from('invoices').insert({
        organization_id: input.organization_id,
        member_id: input.member_id,
        payment_record_id: input.payment_record_id ?? null,
        invoice_number: '', // trigger fills it
        plan_name: input.plan_name,
        base_amount: baseAmount,
        cgst_rate: cgstRate,
        cgst_amount: cgstAmount,
        sgst_rate: sgstRate,
        sgst_amount: sgstAmount,
        total_amount: input.total_amount,
        payment_method: input.payment_method ?? 'cash',
        upi_vpa: input.upi_vpa ?? null,
        status: input.status ?? 'issued',
        notes: input.notes ?? null,
        created_by: user!.id,
      } as any).select().single();
      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['invoices', vars.organization_id] });
      toast.success('Invoice generated');
    },
    onError: (e: any) => toast.error('Failed: ' + e.message),
  });
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('invoices').update({ status } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Status updated');
    },
  });
}
