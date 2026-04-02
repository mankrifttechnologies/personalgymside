import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOverduePayments, useSendBulkMessage } from '@/hooks/useCommunications';
import { AlertTriangle, Send, Loader2, IndianRupee } from 'lucide-react';
import { format, isPast } from 'date-fns';

export default function PaymentReminders() {
  const { data: payments = [], isLoading } = useOverduePayments();
  const sendBulk = useSendBulkMessage();

  const sendReminder = (userId: string, name: string, amount: number, currency: string) => {
    sendBulk.mutate({
      recipientIds: [userId],
      content: `Hi ${name}, this is a friendly reminder that your payment of ${currency} ${amount} is pending. Please settle it at your earliest convenience. Thank you! 🙏`,
    });
  };

  const sendAllReminders = () => {
    const recipientIds = payments
      .filter(p => p.user_id)
      .map(p => p.user_id as string);
    const unique = [...new Set(recipientIds)];
    sendBulk.mutate({
      recipientIds: unique,
      content: `Hi! This is a reminder that you have a pending payment. Please visit the gym desk or check your membership details to settle it. Thank you! 🙏`,
    });
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            Payment Reminders ({payments.length})
          </CardTitle>
          {payments.length > 0 && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={sendAllReminders} disabled={sendBulk.isPending}>
              <Send className="w-3 h-3 mr-1" />
              Remind All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No pending payments 🎉</p>
        ) : (
          payments.slice(0, 20).map(p => (
            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{p.member_name}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <IndianRupee className="w-3 h-3" />
                    {p.amount}
                  </span>
                  {p.due_date && (
                    <Badge
                      variant={isPast(new Date(p.due_date)) ? 'destructive' : 'outline'}
                      className="text-[9px] px-1"
                    >
                      {isPast(new Date(p.due_date)) ? 'Overdue' : 'Due'} {format(new Date(p.due_date), 'MMM d')}
                    </Badge>
                  )}
                </div>
              </div>
              {p.user_id && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs shrink-0"
                  onClick={() => sendReminder(p.user_id!, p.member_name, Number(p.amount), p.currency)}
                  disabled={sendBulk.isPending}
                >
                  <Send className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
