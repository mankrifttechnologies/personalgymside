import { useState } from 'react';
import { usePaymentRecords, useCreatePayment, useUpdatePayment, useMembershipPlans } from '@/hooks/useRevenue';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, AlertTriangle, CheckCircle2, Clock, IndianRupee, Receipt } from 'lucide-react';
import { format } from 'date-fns';

export default function PaymentTracker() {
  const { data: payments, isLoading } = usePaymentRecords();
  const { data: plans } = useMembershipPlans();
  const { data: users } = useAdminUsers();
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [form, setForm] = useState({
    member_id: '', plan_id: '', amount: 0, payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0], due_date: '', status: 'paid', notes: '',
  });

  const resetForm = () => {
    setForm({
      member_id: '', plan_id: '', amount: 0, payment_method: 'cash',
      payment_date: new Date().toISOString().split('T')[0], due_date: '', status: 'paid', notes: '',
    });
  };

  const handleSave = async () => {
    await createPayment.mutateAsync({
      ...form,
      due_date: form.due_date || null,
      plan_id: form.plan_id || null,
    } as any);
    setSheetOpen(false);
    resetForm();
  };

  const handleSelectPlan = (planId: string) => {
    const plan = plans?.find(p => p.id === planId);
    if (plan) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + plan.duration_days);
      setForm({
        ...form,
        plan_id: planId,
        amount: plan.price,
        due_date: dueDate.toISOString().split('T')[0],
      });
    }
  };

  const getMemberName = (memberId: string) => {
    // member_id maps to gym_members.id, but we display from users list
    return memberId.slice(0, 8) + '...';
  };

  const filteredPayments = payments?.filter(p => filter === 'all' || p.status === filter) || [];

  const overduePayments = payments?.filter(
    p => p.status === 'pending' && p.due_date && new Date(p.due_date) < new Date()
  ) || [];

  const statusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
      case 'pending': return <Clock className="w-3.5 h-3.5 text-yellow-500" />;
      case 'overdue': return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Overdue Alert */}
      {overduePayments.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-xs font-medium text-destructive">
              {overduePayments.length} overdue payment{overduePayments.length > 1 ? 's' : ''} need attention
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-base">Payments</h3>
        <Sheet open={sheetOpen} onOpenChange={(o) => { setSheetOpen(o); if (!o) resetForm(); }}>
          <SheetTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs h-8">
              <Plus className="w-3.5 h-3.5" /> Record Payment
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Record Payment</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Member</Label>
                <Select value={form.member_id} onValueChange={v => setForm({ ...form, member_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                  <SelectContent>
                    {users?.map(u => (
                      <SelectItem key={u.user_id} value={u.user_id}>{u.name || u.user_id.slice(0, 8)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Plan (Optional)</Label>
                <Select value={form.plan_id} onValueChange={handleSelectPlan}>
                  <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                  <SelectContent>
                    {plans?.filter(p => p.is_active).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} - ₹{p.price}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Amount (₹)</Label>
                  <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Method</Label>
                  <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Payment Date</Label>
                  <Input type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Due Date</Label>
                  <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Optional notes..." />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={createPayment.isPending || !form.member_id || !form.amount}>
                {createPayment.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Record Payment
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'paid', 'pending', 'partial', 'refunded'].map(f => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} className="text-xs h-7 shrink-0" onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredPayments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No payments found</p>
          </div>
        )}
        {filteredPayments.map(payment => {
          const isOverdue = payment.status === 'pending' && payment.due_date && new Date(payment.due_date) < new Date();
          return (
            <Card key={payment.id} className={isOverdue ? 'border-destructive/50' : ''}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {statusIcon(isOverdue ? 'overdue' : payment.status)}
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{payment.invoice_number || 'No Invoice'}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(payment.payment_date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-0.5 justify-end">
                      <IndianRupee className="w-3 h-3" />
                      <span className="font-bold text-sm">{payment.amount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="outline" className="text-[10px]">{payment.payment_method}</Badge>
                      {isOverdue ? (
                        <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
                      ) : (
                        <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'} className="text-[10px]">{payment.status}</Badge>
                      )}
                    </div>
                  </div>
                </div>
                {isOverdue && (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" className="text-xs h-7 flex-1" onClick={() => updatePayment.mutate({ id: payment.id, status: 'paid' })}>
                      Mark Paid
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
