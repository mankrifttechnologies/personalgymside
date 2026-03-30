import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePTSessions, useTrainers } from '@/hooks/usePTSessions';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import BottomNav from '@/components/BottomNav';
import {
  Calendar, Clock, Plus, Loader2, CheckCircle2, XCircle, User, CalendarDays
} from 'lucide-react';
import { format } from 'date-fns';

export default function PTSessions() {
  const { user, loading: authLoading } = useAuth();
  const { upcomingSessions, pastSessions, isLoading, bookSession, updateSessionStatus } = usePTSessions();
  const { data: trainers } = useTrainers();
  const { profile } = useProfile();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [form, setForm] = useState({
    trainer_id: '',
    session_date: '',
    start_time: '09:00',
    end_time: '10:00',
    notes: '',
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const handleBook = async () => {
    if (!form.trainer_id || !form.session_date) return;
    await bookSession.mutateAsync(form);
    setBookingOpen(false);
    setForm({ trainer_id: '', session_date: '', start_time: '09:00', end_time: '10:00', notes: '' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-accent text-accent-foreground text-[10px]">Confirmed</Badge>;
      case 'pending': return <Badge variant="secondary" className="text-[10px]">Pending</Badge>;
      case 'completed': return <Badge variant="outline" className="text-[10px]">Completed</Badge>;
      case 'cancelled': return <Badge variant="destructive" className="text-[10px]">Cancelled</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  // Check if current user is a trainer (to show accept/reject buttons)
  const isTrainer = upcomingSessions.some(s => s.trainer_id === user.id);

  return (
    <div className="min-h-screen pb-24 safe-area-top">
      <header className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">PT Sessions</h1>
            <p className="text-sm text-muted-foreground">Book 1-on-1 training</p>
          </div>
          <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 rounded-xl">
                <Plus className="w-4 h-4" />
                Book
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Book a PT Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Trainer</Label>
                  <Select value={form.trainer_id} onValueChange={(v) => setForm({ ...form, trainer_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select trainer" /></SelectTrigger>
                    <SelectContent>
                      {trainers?.map(t => (
                        <SelectItem key={t.user_id} value={t.user_id}>
                          {t.name || 'Trainer'}
                        </SelectItem>
                      ))}
                      {(!trainers || trainers.length === 0) && (
                        <div className="p-3 text-sm text-muted-foreground text-center">No trainers available</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={form.session_date}
                    onChange={(e) => setForm({ ...form, session_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={form.start_time}
                      onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={form.end_time}
                      onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Any specific goals or injuries to note..."
                  />
                </div>
                <Button
                  className="w-full h-12 rounded-xl"
                  onClick={handleBook}
                  disabled={bookSession.isPending || !form.trainer_id || !form.session_date}
                >
                  {bookSession.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
                  Book Session
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="upcoming">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming" className="text-xs">
                <CalendarDays className="w-3.5 h-3.5 mr-1" />
                Upcoming ({upcomingSessions.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="text-xs">
                <Clock className="w-3.5 h-3.5 mr-1" />
                Past ({pastSessions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-4 space-y-3">
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No upcoming sessions</p>
                  <p className="text-sm mt-1">Book a session with a trainer to get started</p>
                </div>
              ) : (
                upcomingSessions.map(session => (
                  <Card key={session.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-primary" />
                            <span className="font-semibold text-sm">
                              {format(new Date(session.session_date), 'EEE, MMM d')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-xs">{session.start_time} – {session.end_time}</span>
                          </div>
                          {session.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{session.notes}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(session.status)}
                          {session.trainer_id === user.id && session.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => updateSessionStatus.mutate({ sessionId: session.id, status: 'confirmed' })}
                              >
                                <CheckCircle2 className="w-4 h-4 text-accent" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => updateSessionStatus.mutate({ sessionId: session.id, status: 'cancelled' })}
                              >
                                <XCircle className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                          {session.member_id === user.id && session.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-destructive"
                              onClick={() => updateSessionStatus.mutate({ sessionId: session.id, status: 'cancelled' })}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-4 space-y-3">
              {pastSessions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No past sessions</p>
                </div>
              ) : (
                pastSessions.map(session => (
                  <Card key={session.id} className="opacity-70">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="font-medium text-sm">
                            {format(new Date(session.session_date), 'MMM d, yyyy')}
                          </span>
                          <p className="text-xs text-muted-foreground">{session.start_time} – {session.end_time}</p>
                        </div>
                        {getStatusBadge(session.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
