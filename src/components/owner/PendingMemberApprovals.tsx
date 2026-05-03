import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserCheck, UserX, Clock, Inbox } from 'lucide-react';
import { toast } from 'sonner';

interface PendingMembersProps {
  organizationId: string | undefined;
  /** Compact variant (used in Overview banner). */
  compact?: boolean;
}

interface PendingMember {
  id: string;
  user_id: string;
  member_code: string;
  created_at: string;
  name: string | null;
  email_hint: string | null;
  avatar_url: string | null;
}

export function usePendingMembers(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['pending-members', organizationId],
    enabled: !!organizationId,
    queryFn: async (): Promise<PendingMember[]> => {
      const { data: rows, error } = await supabase
        .from('gym_members')
        .select('id, user_id, member_code, created_at, is_verified')
        .eq('organization_id', organizationId)
        .eq('is_verified', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!rows?.length) return [];

      const userIds = rows.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);
      const profMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        member_code: r.member_code,
        created_at: r.created_at,
        name: profMap.get(r.user_id)?.name ?? null,
        email_hint: null,
        avatar_url: profMap.get(r.user_id)?.avatar_url ?? null,
      }));
    },
  });
}

export default function PendingMemberApprovals({
  organizationId,
  compact = false,
}: PendingMembersProps) {
  const queryClient = useQueryClient();
  const { data: pending, isLoading } = usePendingMembers(organizationId);

  const approve = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('gym_members')
        .update({ is_verified: true } as any)
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-members', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['member-verification'] });
      toast.success('Member approved');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const reject = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from('gym_members').delete().eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-members', organizationId] });
      toast.success('Request removed');
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!pending || pending.length === 0) {
    if (compact) return null;
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">All caught up!</p>
          <p className="text-sm mt-1">No members are waiting for approval.</p>
        </CardContent>
      </Card>
    );
  }

  // Compact banner for Overview tab
  if (compact) {
    return (
      <Card className="border-warning/40 bg-warning/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-warning/15">
              <Clock className="w-4 h-4 text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">
                {pending.length} {pending.length === 1 ? 'member is' : 'members are'} waiting for
                approval
              </p>
              <p className="text-xs text-muted-foreground">
                Approve to unlock attendance check-in &amp; bookings.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {pending.slice(0, 3).map((m) => (
              <PendingRow
                key={m.id}
                member={m}
                onApprove={() => approve.mutate(m.id)}
                onReject={() => reject.mutate(m.id)}
                busy={approve.isPending || reject.isPending}
              />
            ))}
            {pending.length > 3 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                + {pending.length - 3} more in the Approvals tab
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-lg flex items-center gap-2">
        Pending Approvals
        <Badge variant="secondary">{pending.length}</Badge>
      </h2>
      <p className="text-xs text-muted-foreground">
        These members signed up themselves with your gym code. Approve them to unlock attendance,
        classes and PT bookings.
      </p>
      <div className="space-y-2">
        {pending.map((m) => (
          <PendingRow
            key={m.id}
            member={m}
            onApprove={() => approve.mutate(m.id)}
            onReject={() => reject.mutate(m.id)}
            busy={approve.isPending || reject.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function PendingRow({
  member,
  onApprove,
  onReject,
  busy,
}: {
  member: PendingMember;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  return (
    <Card className="bg-background">
      <CardContent className="p-3 flex items-center gap-3">
        <Avatar className="w-9 h-9">
          <AvatarImage src={member.avatar_url || undefined} />
          <AvatarFallback>{member.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{member.name || 'New member'}</p>
          <p className="text-[11px] text-muted-foreground font-mono truncate">
            {member.member_code}
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={onReject}
            disabled={busy}
            aria-label="Reject"
          >
            <UserX className="w-4 h-4 text-destructive" />
          </Button>
          <Button
            size="sm"
            className="h-8 px-2 gap-1"
            onClick={onApprove}
            disabled={busy}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="text-xs">Approve</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
