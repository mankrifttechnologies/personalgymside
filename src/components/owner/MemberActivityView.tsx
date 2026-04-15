import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2, Activity, Dumbbell, CalendarCheck, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import type { OrgMember } from '@/hooks/useOrgMembers';
import { useOrgMembers } from '@/hooks/useOrgMembers';

export default function MemberActivityView({ organizationId }: { organizationId?: string }) {
  const { data: members, isLoading } = useOrgMembers(organizationId);
  const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-lg flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        Member Activity
      </h2>
      {members?.map(member => (
        <Card key={member.org_member_id} className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSelectedMember(member)}>
          <CardContent className="p-4 flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={member.avatar_url || ''} />
              <AvatarFallback>{member.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{member.name || 'No Name'}</p>
              <Badge variant={member.status === 'active' ? 'default' : 'destructive'} className="text-[10px]">
                {member.status}
              </Badge>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
      ))}
      {(!members || members.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No members in your organization yet</p>
          </CardContent>
        </Card>
      )}

      <Sheet open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={selectedMember?.avatar_url || ''} />
                <AvatarFallback>{selectedMember?.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              {selectedMember?.name || 'Member'}
            </SheetTitle>
          </SheetHeader>
          {selectedMember && <MemberDetails userId={selectedMember.user_id} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MemberDetails({ userId }: { userId: string }) {
  const { data: workouts, isLoading: wLoading } = useQuery({
    queryKey: ['member-workouts', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('workouts')
        .select('id, workout_date, workout_type, duration_minutes, total_volume')
        .eq('user_id', userId)
        .order('workout_date', { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const { data: gymMember } = useQuery({
    queryKey: ['member-gym-record', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('gym_members')
        .select('id, member_code, joined_at, status')
        .eq('user_id', userId)
        .maybeSingle();
      return data;
    },
  });

  const { data: attendance, isLoading: aLoading } = useQuery({
    queryKey: ['member-attendance', gymMember?.id],
    queryFn: async () => {
      if (!gymMember?.id) return [];
      const { data } = await supabase
        .from('attendance_logs')
        .select('check_in_time, check_out_time, duration_minutes')
        .eq('member_id', gymMember.id)
        .order('check_in_time', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!gymMember?.id,
  });

  return (
    <div className="space-y-4 mt-4">
      {gymMember && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Membership Info</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p><span className="text-muted-foreground">Code:</span> {gymMember.member_code}</p>
            <p><span className="text-muted-foreground">Joined:</span> {format(new Date(gymMember.joined_at), 'dd MMM yyyy')}</p>
            <p><span className="text-muted-foreground">Status:</span> <Badge variant={gymMember.status === 'active' ? 'default' : 'destructive'} className="text-[10px]">{gymMember.status}</Badge></p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Dumbbell className="w-4 h-4" /> Recent Workouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {wLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : workouts && workouts.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-auto">
              {workouts.map((w: any) => (
                <div key={w.id} className="flex justify-between text-sm border-b border-border/50 pb-1">
                  <span>{format(new Date(w.workout_date), 'dd MMM')}</span>
                  <span className="text-muted-foreground">{w.workout_type}</span>
                  <span>{w.duration_minutes}min</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No workouts recorded</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" /> Attendance Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : attendance && attendance.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-auto">
              {attendance.map((a: any, i: number) => (
                <div key={i} className="flex justify-between text-sm border-b border-border/50 pb-1">
                  <span>{format(new Date(a.check_in_time), 'dd MMM HH:mm')}</span>
                  <span className="text-muted-foreground">{a.duration_minutes ? `${a.duration_minutes}min` : 'In gym'}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No attendance records</p>}
        </CardContent>
      </Card>
    </div>
  );
}
