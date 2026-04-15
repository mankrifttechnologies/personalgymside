import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  Dumbbell, Users, Calendar, LogOut, Loader2, Activity,
  ChevronRight, Clock, CalendarCheck, MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function TrainerDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState('clients');

  // Get trainer's assigned members
  const { data: assignedMembers, isLoading: membersLoading } = useQuery({
    queryKey: ['trainer-assigned-members', user?.id],
    queryFn: async () => {
      const { data: gymMembers, error } = await supabase
        .from('gym_members')
        .select('id, user_id, member_code, joined_at, status, batch')
        .eq('trainer_id', user!.id)
        .eq('status', 'active');
      if (error) throw error;
      if (!gymMembers?.length) return [];

      const userIds = gymMembers.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return gymMembers.map(m => ({
        ...m,
        name: profileMap.get(m.user_id)?.name || 'Unknown',
        avatar_url: profileMap.get(m.user_id)?.avatar_url || null,
      }));
    },
    enabled: !!user?.id,
  });

  // Get trainer's PT sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['trainer-sessions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pt_sessions')
        .select('*')
        .eq('trainer_id', user!.id)
        .gte('session_date', format(new Date(), 'yyyy-MM-dd'))
        .order('session_date', { ascending: true })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (role !== 'trainer' && role !== 'admin' && role !== 'owner') return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen safe-area-top bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/15">
              <Dumbbell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Trainer Dashboard</h1>
              <p className="text-xs text-muted-foreground">Manage your clients</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => signOut()}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card>
            <CardContent className="p-3 text-center">
              <Users className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold">{assignedMembers?.length || 0}</p>
              <p className="text-[10px] text-muted-foreground">Clients</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Calendar className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold">{sessions?.filter(s => s.session_date === format(new Date(), 'yyyy-MM-dd')).length || 0}</p>
              <p className="text-[10px] text-muted-foreground">Today's Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Clock className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold">{sessions?.length || 0}</p>
              <p className="text-[10px] text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="clients" className="gap-1.5 text-xs py-2.5">
              <Users className="w-4 h-4" /> My Clients
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-1.5 text-xs py-2.5">
              <Calendar className="w-4 h-4" /> Sessions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="mt-4 space-y-3">
            {membersLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : assignedMembers && assignedMembers.length > 0 ? (
              assignedMembers.map(member => (
                <ClientCard key={member.id} member={member} />
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No clients assigned</p>
                  <p className="text-sm mt-1">Ask your gym owner to assign members to you</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sessions" className="mt-4 space-y-3">
            {sessionsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : sessions && sessions.length > 0 ? (
              sessions.map(session => (
                <Card key={session.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{format(new Date(session.session_date), 'dd MMM yyyy')}</p>
                        <p className="text-xs text-muted-foreground">{session.start_time} - {session.end_time}</p>
                      </div>
                      <Badge variant={session.status === 'scheduled' ? 'default' : session.status === 'completed' ? 'secondary' : 'destructive'} className="text-[10px]">
                        {session.status}
                      </Badge>
                    </div>
                    {session.notes && <p className="text-xs text-muted-foreground mt-2">{session.notes}</p>}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No upcoming sessions</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ClientCard({ member }: { member: any }) {
  const [open, setOpen] = useState(false);

  const { data: recentWorkouts } = useQuery({
    queryKey: ['client-workouts', member.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('workouts')
        .select('id, workout_date, workout_type, duration_minutes')
        .eq('user_id', member.user_id)
        .order('workout_date', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: open,
  });

  return (
    <>
      <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setOpen(true)}>
        <CardContent className="p-4 flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={member.avatar_url || ''} />
            <AvatarFallback>{member.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{member.name}</p>
            <p className="text-xs text-muted-foreground">Code: {member.member_code}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={member.avatar_url || ''} />
                <AvatarFallback>{member.name?.[0]}</AvatarFallback>
              </Avatar>
              {member.name}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Info</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Code:</span> {member.member_code}</p>
                <p><span className="text-muted-foreground">Joined:</span> {format(new Date(member.joined_at), 'dd MMM yyyy')}</p>
                {member.batch && <p><span className="text-muted-foreground">Batch:</span> {member.batch}</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4" /> Recent Workouts</CardTitle>
              </CardHeader>
              <CardContent>
                {recentWorkouts && recentWorkouts.length > 0 ? (
                  <div className="space-y-2">
                    {recentWorkouts.map((w: any) => (
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
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
