import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChurnRisk } from '@/hooks/useAdvancedAnalytics';
import { useSendBulkMessage } from '@/hooks/useCommunications';
import { AlertTriangle, Loader2, Send, UserX, TrendingDown } from 'lucide-react';

export default function ChurnPredictor() {
  const { data: members = [], isLoading } = useChurnRisk();
  const sendMessage = useSendBulkMessage();
  const atRisk = members.filter(m => m.riskLevel === 'high' || m.riskLevel === 'medium');

  const handleReengage = (userId: string) => {
    sendMessage.mutate({
      recipientIds: [userId],
      content: "Hey! We noticed you haven't been around lately. We miss you at the gym! Come back and let's crush some goals together 💪",
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

  const riskColor = (level: string) => {
    if (level === 'high') return 'destructive';
    if (level === 'medium') return 'secondary';
    return 'outline';
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-destructive" />
          Churn Risk ({atRisk.length} at risk)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {atRisk.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">All members are active! 🎉</p>
        ) : (
          atRisk.slice(0, 10).map(m => (
            <div key={m.memberId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
              <Avatar className="w-8 h-8">
                <AvatarImage src={m.avatar || ''} />
                <AvatarFallback className="text-xs">{m.name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.name}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{m.visits30d} visits/30d</span>
                  {m.hasOverduePayment && (
                    <Badge variant="destructive" className="text-[9px] px-1">Overdue</Badge>
                  )}
                </div>
              </div>
              <Badge variant={riskColor(m.riskLevel)} className="text-[10px] shrink-0">
                {m.riskLevel}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 shrink-0"
                onClick={() => handleReengage(m.userId)}
                disabled={sendMessage.isPending}
              >
                <Send className="w-3 h-3" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
