import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useNotificationQueue,
  useRunDunningSweep,
  useMarkNotificationSent,
} from '@/hooks/useDunning';
import { Inbox, Play, Loader2, Check, MessageSquare, Phone, Bell, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  organizationId: string;
}

export default function NotificationQueueView({ organizationId }: Props) {
  const { data: queue = [], isLoading } = useNotificationQueue(organizationId);
  const sweep = useRunDunningSweep();
  const markSent = useMarkNotificationSent();

  const channelIcon = (c: string) => {
    if (c === 'whatsapp') return <MessageSquare className="w-3 h-3" />;
    if (c === 'sms') return <Phone className="w-3 h-3" />;
    return <Bell className="w-3 h-3" />;
  };

  const buildLink = (n: typeof queue[number]) => {
    if (n.channel === 'whatsapp' && n.recipient_phone) {
      const phone = n.recipient_phone.replace(/[^\d]/g, '');
      return `https://wa.me/${phone}?text=${encodeURIComponent(n.message)}`;
    }
    if (n.channel === 'sms' && n.recipient_phone) {
      return `sms:${n.recipient_phone}?body=${encodeURIComponent(n.message)}`;
    }
    return null;
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Inbox className="w-4 h-4 text-primary" />
            Notification Queue ({queue.length})
          </CardTitle>
          <Button size="sm" onClick={() => sweep.mutate(organizationId)} disabled={sweep.isPending} className="gap-1.5">
            {sweep.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run Sweep
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : queue.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Queue is empty. Click "Run Sweep" to scan overdue payments and queue reminders.
          </p>
        ) : (
          queue.map(n => {
            const link = buildLink(n);
            return (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-medium text-sm">{n.recipient_name || 'Unknown'}</p>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      {channelIcon(n.channel)} {n.channel}
                    </Badge>
                    <Badge
                      variant={n.status === 'sent' ? 'default' : n.status === 'failed' ? 'destructive' : 'secondary'}
                      className="text-[10px]"
                    >
                      {n.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(n.scheduled_for), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                </div>
                {n.status === 'pending' && (
                  <div className="flex flex-col gap-1">
                    {link && (
                      <Button size="icon" variant="outline" className="h-7 w-7" asChild>
                        <a href={link} target="_blank" rel="noreferrer" title="Open">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      title="Mark sent"
                      onClick={() => markSent.mutate(n.id)}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
