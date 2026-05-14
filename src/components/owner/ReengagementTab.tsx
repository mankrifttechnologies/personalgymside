import { useMemo } from 'react';
import { useInactiveMembers, useLogReengagementContact, useReengagementContacts, type InactiveMember } from '@/hooks/useReengagement';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageCircle, Smartphone, CheckCheck, UserX, AlertTriangle, Clock } from 'lucide-react';
import { buildWhatsAppShareUrl, buildSmsUrl } from '@/lib/upi';
import { formatDistanceToNow } from 'date-fns';

interface Props { organizationId?: string }

const TEMPLATES = {
  7: (name: string) => `Hi ${name}, we noticed you haven't been to the gym this week. Everything okay? Hit reply and we'll help you get back on track 💪`,
  14: (name: string) => `Hi ${name}, miss you at the gym! It's been 2 weeks. Want to join one of our classes this week to get the streak back?`,
  30: (name: string) => `Hi ${name}, it's been over a month! We'd love to have you back. Reply for a free PT consultation to restart your routine.`,
};

export default function ReengagementTab({ organizationId }: Props) {
  const { data: inactive, isLoading } = useInactiveMembers(organizationId);
  const { data: contacts } = useReengagementContacts(organizationId);
  const logContact = useLogReengagementContact();

  const recentlyContactedIds = useMemo(() => {
    const oneDayAgo = Date.now() - 86400000;
    return new Set(
      (contacts || [])
        .filter((c: any) => new Date(c.contacted_at).getTime() > oneDayAgo)
        .map((c: any) => c.member_id)
    );
  }, [contacts]);

  const buckets = useMemo(() => {
    const b: Record<7 | 14 | 30, InactiveMember[]> = { 7: [], 14: [], 30: [] };
    (inactive || []).forEach(m => b[m.bucket].push(m));
    return b;
  }, [inactive]);

  if (!organizationId) return <p className="text-sm text-muted-foreground">No organization selected.</p>;
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Win them back</p>
        <p>Tap WhatsApp to send a pre-written nudge. We log every contact so you don't message the same person twice in 24h.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center">
          <Clock className="w-5 h-5 mx-auto text-yellow-500 mb-1" />
          <p className="text-lg font-bold">{buckets[7].length}</p>
          <p className="text-[10px] text-muted-foreground">7+ days</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <AlertTriangle className="w-5 h-5 mx-auto text-orange-500 mb-1" />
          <p className="text-lg font-bold">{buckets[14].length}</p>
          <p className="text-[10px] text-muted-foreground">14+ days</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <UserX className="w-5 h-5 mx-auto text-destructive mb-1" />
          <p className="text-lg font-bold">{buckets[30].length}</p>
          <p className="text-[10px] text-muted-foreground">30+ days</p>
        </CardContent></Card>
      </div>

      {([30, 14, 7] as const).map(bucket => (
        buckets[bucket].length > 0 && (
          <div key={bucket} className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {bucket === 30 ? 'At risk (30+ days)' : bucket === 14 ? 'Slipping (14+ days)' : 'Cooling off (7+ days)'}
            </h3>
            {buckets[bucket].map(m => {
              const msg = TEMPLATES[bucket](m.name);
              const recent = recentlyContactedIds.has(m.member_id);
              return (
                <Card key={m.member_id}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.last_check_in ? `Last seen ${formatDistanceToNow(new Date(m.last_check_in), { addSuffix: true })}` : 'Never checked in'}
                        </p>
                      </div>
                      {recent && <Badge variant="secondary" className="text-[10px]"><CheckCheck className="w-2.5 h-2.5 mr-1" />Contacted</Badge>}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" asChild
                        onClick={() => logContact.mutate({ organization_id: organizationId, member_id: m.member_id, channel: 'whatsapp', message: msg })}>
                        <a href={buildWhatsAppShareUrl(m.phone, msg)} target="_blank" rel="noreferrer">
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" asChild
                        onClick={() => logContact.mutate({ organization_id: organizationId, member_id: m.member_id, channel: 'sms', message: msg })}>
                        <a href={buildSmsUrl(m.phone, msg)}>
                          <Smartphone className="w-3.5 h-3.5" /> SMS
                        </a>
                      </Button>
                    </div>
                    {!m.phone && <p className="text-[10px] text-destructive">No phone on file. Ask member to add it in profile.</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ))}

      {(!inactive || inactive.length === 0) && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          <CheckCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Everyone's active!</p>
          <p className="text-sm mt-1">No members have been inactive for 7+ days.</p>
        </CardContent></Card>
      )}
    </div>
  );
}
