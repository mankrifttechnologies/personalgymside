import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { History, IndianRupee, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  gymMemberId: string;
  memberName: string;
}

export default function MemberPaymentHistory({ gymMemberId, memberName }: Props) {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['member-payment-history', gymMemberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_records')
        .select('*, membership_plans(name)')
        .eq('member_id', gymMemberId)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!gymMemberId,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
          <History className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-primary" />
            {memberName}'s Payment History
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : payments && payments.length > 0 ? (
          <div className="space-y-3 mt-2">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <Card>
                <CardContent className="p-2.5">
                  <p className="text-lg font-bold text-primary">
                    ₹{payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Total Paid</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2.5">
                  <p className="text-lg font-bold">{payments.length}</p>
                  <p className="text-[10px] text-muted-foreground">Transactions</p>
                </CardContent>
              </Card>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              {payments.map(p => (
                <Card key={p.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">₹{Number(p.amount).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(p.payment_date), 'dd MMM yyyy')} • {p.payment_method}
                        </p>
                        {(p as any).membership_plans?.name && (
                          <p className="text-xs text-primary mt-0.5">{(p as any).membership_plans.name}</p>
                        )}
                        {p.notes && <p className="text-xs text-muted-foreground mt-0.5">{p.notes}</p>}
                      </div>
                      <Badge
                        variant={p.status === 'paid' ? 'default' : p.status === 'pending' ? 'secondary' : 'destructive'}
                        className="text-[10px]"
                      >
                        {p.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <IndianRupee className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No payment history yet</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
