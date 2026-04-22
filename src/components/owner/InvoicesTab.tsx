import { useState, useMemo } from 'react';
import { useInvoices, useCreateInvoice, useUpdateInvoiceStatus, type Invoice } from '@/hooks/useInvoices';
import { useOrgBranding } from '@/hooks/useOrgBranding';
import { useOrgMembers } from '@/hooks/useOrgMembers';
import { useMembershipPlans } from '@/hooks/useRevenue';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Plus, CheckCircle2, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { generateInvoicePDF, downloadBlob, type InvoiceData, type BrandingData } from '@/lib/invoiceGenerator';

interface Props {
  organizationId?: string;
}

export default function InvoicesTab({ organizationId }: Props) {
  const { data: invoices, isLoading } = useInvoices(organizationId);
  const { data: branding } = useOrgBranding(organizationId);
  const { data: members } = useOrgMembers(organizationId);
  const { data: plans } = useMembershipPlans();
  const createInvoice = useCreateInvoice();
  const updateStatus = useUpdateInvoiceStatus();

  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [form, setForm] = useState({
    member_user_id: '',
    plan_name: '',
    amount: '',
    cgst_rate: '9',
    sgst_rate: '9',
    payment_method: 'cash',
    status: 'issued',
    notes: '',
  });

  // Map user_id → gym_member.id + name
  const { data: gymMembers } = useQuery({
    queryKey: ['gym-members-for-invoices', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data } = await supabase
        .from('gym_members')
        .select('id, user_id')
        .eq('organization_id', organizationId);
      return data || [];
    },
    enabled: !!organizationId,
  });

  const memberMap = useMemo(() => {
    const m = new Map<string, { gymMemberId: string; name: string; phone: string | null; email: string | null }>();
    members?.forEach((om: any) => {
      const gm = gymMembers?.find(g => g.user_id === om.user_id);
      if (gm) {
        m.set(om.user_id, {
          gymMemberId: gm.id,
          name: om.name || 'Member',
          phone: om.phone || null,
          email: om.email || null,
        });
      }
    });
    return m;
  }, [members, gymMembers]);

  const handleCreate = async () => {
    if (!organizationId || !form.member_user_id || !form.plan_name || !form.amount) {
      toast.error('Fill member, plan & amount');
      return;
    }
    const memberInfo = memberMap.get(form.member_user_id);
    if (!memberInfo) {
      toast.error('Member not found');
      return;
    }
    await createInvoice.mutateAsync({
      organization_id: organizationId,
      member_id: memberInfo.gymMemberId,
      plan_name: form.plan_name,
      total_amount: Number(form.amount),
      cgst_rate: Number(form.cgst_rate),
      sgst_rate: Number(form.sgst_rate),
      payment_method: form.payment_method,
      upi_vpa: branding?.upi_vpa || null,
      status: form.status,
      notes: form.notes || undefined,
    });
    setOpen(false);
    setForm({ member_user_id: '', plan_name: '', amount: '', cgst_rate: '9', sgst_rate: '9', payment_method: 'cash', status: 'issued', notes: '' });
  };

  const handleDownload = async (inv: Invoice) => {
    setDownloading(inv.id);
    try {
      // Find member info
      const gm = gymMembers?.find(g => g.id === inv.member_id);
      const om: any = members?.find((m: any) => m.user_id === gm?.user_id);
      const name = om?.name || 'Member';

      const invoiceData: InvoiceData = {
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        member_name: name,
        member_phone: om?.phone || null,
        member_email: om?.email || null,
        plan_name: inv.plan_name,
        base_amount: Number(inv.base_amount),
        cgst_rate: Number(inv.cgst_rate),
        cgst_amount: Number(inv.cgst_amount),
        sgst_rate: Number(inv.sgst_rate),
        sgst_amount: Number(inv.sgst_amount),
        total_amount: Number(inv.total_amount),
        currency: inv.currency,
        payment_method: inv.payment_method,
        notes: inv.notes,
        status: inv.status,
      };

      // Get org details
      const { data: org } = await supabase.from('organizations').select('name, address, phone, email').eq('id', inv.organization_id).maybeSingle();

      const brandingData: BrandingData = {
        org_name: org?.name || 'Gym',
        logo_url: branding?.logo_url || null,
        brand_color: branding?.brand_color || '#0EA5E9',
        address: org?.address || null,
        phone: org?.phone || null,
        email: org?.email || null,
        gst_number: branding?.gst_number || null,
        upi_vpa: branding?.upi_vpa || null,
        upi_payee_name: branding?.upi_payee_name || null,
        invoice_prefix: branding?.invoice_prefix || 'INV',
      };

      const blob = await generateInvoicePDF(invoiceData, brandingData);
      downloadBlob(blob, `${inv.invoice_number}.pdf`);
      toast.success('Invoice downloaded');
    } catch (e: any) {
      toast.error('Download failed: ' + e.message);
    } finally {
      setDownloading(null);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: any; icon: any; label: string }> = {
      paid: { variant: 'default', icon: CheckCircle2, label: 'Paid' },
      issued: { variant: 'secondary', icon: Clock, label: 'Issued' },
      overdue: { variant: 'destructive', icon: AlertTriangle, label: 'Overdue' },
      cancelled: { variant: 'outline', icon: AlertTriangle, label: 'Cancelled' },
    };
    const s = map[status] || map.issued;
    const Icon = s.icon;
    return (
      <Badge variant={s.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {s.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              GST Invoices
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {branding?.gst_number ? `GSTIN: ${branding.gst_number}` : 'Add GSTIN in Branding tab'}
              {branding?.upi_vpa && ` • UPI: ${branding.upi_vpa}`}
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create GST Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Member *</Label>
                  <Select value={form.member_user_id} onValueChange={(v) => setForm({ ...form, member_user_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                    <SelectContent>
                      {Array.from(memberMap.entries()).map(([uid, info]) => (
                        <SelectItem key={uid} value={uid}>{info.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Plan *</Label>
                  <Select value={form.plan_name} onValueChange={(v) => {
                    const p = plans?.find(pl => pl.name === v);
                    setForm({ ...form, plan_name: v, amount: p ? String(p.price) : form.amount });
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select plan or type below" /></SelectTrigger>
                    <SelectContent>
                      {plans?.map(p => (
                        <SelectItem key={p.id} value={p.name}>{p.name} — ₹{p.price}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="mt-2"
                    placeholder="Or enter custom plan name"
                    value={form.plan_name}
                    onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>Total (₹) *</Label>
                    <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                  </div>
                  <div>
                    <Label>CGST %</Label>
                    <Input type="number" value={form.cgst_rate} onChange={(e) => setForm({ ...form, cgst_rate: e.target.value })} />
                  </div>
                  <div>
                    <Label>SGST %</Label>
                    <Input type="number" value={form.sgst_rate} onChange={(e) => setForm({ ...form, sgst_rate: e.target.value })} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Total is GST-inclusive. Base & taxes are auto-calculated.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Method</Label>
                    <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="issued">Issued (unpaid)</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button onClick={handleCreate} disabled={createInvoice.isPending} className="w-full">
                  {createInvoice.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Invoice'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
          ) : !invoices?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No invoices yet. Create your first GST invoice.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map(inv => {
                const gm = gymMembers?.find(g => g.id === inv.member_id);
                const om: any = members?.find((m: any) => m.user_id === gm?.user_id);
                const name = om?.name || 'Member';
                return (
                  <div key={inv.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-primary">{inv.invoice_number}</span>
                        {statusBadge(inv.status)}
                      </div>
                      <p className="text-sm font-medium mt-1 truncate">{name} — {inv.plan_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(inv.invoice_date), 'dd MMM yyyy')} • ₹{Number(inv.total_amount).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {inv.status !== 'paid' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: inv.id, status: 'paid' })}>
                          Mark Paid
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleDownload(inv)} disabled={downloading === inv.id}>
                        {downloading === inv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
