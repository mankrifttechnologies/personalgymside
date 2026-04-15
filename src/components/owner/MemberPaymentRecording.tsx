import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrgMembers } from '@/hooks/useOrgMembers';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { IndianRupee, Plus, Loader2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface MemberPaymentProps {
  organizationId?: string;
}

export default function MemberPaymentRecording({ organizationId }: MemberPaymentProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: members } = useOrgMembers(organizationId);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    member_user_id: '',
    amount: '',
    payment_method: 'cash',
    status: 'paid',
    notes: '',
    plan_id: '',
  });

  // Get gym_member IDs for org members
  const { data: gymMemberMap } = useQuery({
    queryKey: ['gym-member-map', organizationId],
    queryFn: async () => {
      if (!members?.length) return new Map<string, string>();
      const userIds = members.map(m => m.user_id);
      const { data } = await supabase
        .from('gym_members')
        .select('id, user_id')
        .in('user_id', userIds);
      return new Map(data?.map(d => [d.user_id, d.id]) || []);
    },
    enabled: !!members?.length,
  });

  // Get payment records for org members
  const { data: payments, isLoading } = useQuery({
    queryKey: ['org-payments', organizationId],
    queryFn: async () => {
      if (!gymMemberMap?.size) return [];
      const memberIds = Array.from(gymMemberMap.values());
      const { data, error } = await supabase
        .from('payment_records')
        .select('*')
        .in('member_id', memberIds)
        .order('payment_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!gymMemberMap?.size,
  });

  // Get plans
  const { data: plans } = useQuery({
    queryKey: ['membership-plans'],
    queryFn: async () => {
      const { data } = await supabase.from('membership_plans').select('id, name, price').eq('is_active', true);
      return data || [];
    },
  });

  const recordPayment = useMutation({
    mutationFn: async () => {
      const memberId = gymMemberMap?.get(form.member_user_id);
      if (!memberId) throw new Error('Member not found in gym records');
      const { error } = await supabase.from('payment_records').insert({
        member_id: memberId,
        amount: parseFloat(form.amount),
        payment_method: form.payment_method,
        status: form.status,
        notes: form.notes || null,
        plan_id: form.plan_id || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-payments'] });
      toast.success('Payment recorded');
      setCreateOpen(false);
      setForm({ member_user_id: '', amount: '', payment_method: 'cash', status: 'paid', notes: '', plan_id: '' });
    },
    onError: (err: any) => toast.error('Failed: ' + err.message),
  });

  const memberNameMap = new Map(members?.map(m => [m.user_id, m.name]) || []);
  const reverseMemberMap = new Map(Array.from(gymMemberMap?.entries() || []).map(([uid, gid]) => [gid, uid]));

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-primary" />
          Payment Records
        </h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Record Payment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Member</Label>
                <Select value={form.member_user_id} onValueChange={v => setForm({ ...form, member_user_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                  <SelectContent>
                    {members?.map(m => (
                      <SelectItem key={m.user_id} value={m.user_id}>{m.name || m.user_id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select value={form.plan_id} onValueChange={v => setForm({ ...form, plan_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      {plans?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} - ₹{p.price}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" rows={2} />
              </div>
              <Button className="w-full" onClick={() => recordPayment.mutate()}
                disabled={recordPayment.isPending || !form.member_user_id || !form.amount}>
                {recordPayment.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <IndianRupee className="w-4 h-4 mr-2" />}
                Record Payment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto text-green-500 mb-1" />
            <p className="text-lg font-bold">₹{payments?.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0).toLocaleString() || 0}</p>
            <p className="text-[10px] text-muted-foreground">Collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Clock className="w-5 h-5 mx-auto text-yellow-500 mb-1" />
            <p className="text-lg font-bold">₹{payments?.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0).toLocaleString() || 0}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto text-destructive mb-1" />
            <p className="text-lg font-bold">₹{payments?.filter(p => p.status === 'overdue').reduce((s, p) => s + Number(p.amount), 0).toLocaleString() || 0}</p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment list */}
      <div className="space-y-2">
        {payments?.map(p => {
          const userId = reverseMemberMap.get(p.member_id);
          const name = userId ? memberNameMap.get(userId) : null;
          return (
            <Card key={p.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{name || 'Member'}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(p.payment_date), 'dd MMM yyyy')} • {p.payment_method}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">₹{Number(p.amount).toLocaleString()}</p>
                  <Badge variant={p.status === 'paid' ? 'default' : p.status === 'pending' ? 'secondary' : 'destructive'} className="text-[10px]">
                    {p.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {(!payments || payments.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <IndianRupee className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No payment records</p>
              <p className="text-sm mt-1">Record your first payment to get started</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
