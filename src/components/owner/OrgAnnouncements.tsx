import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Megaphone, Plus, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function OrgAnnouncements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', priority: 'normal', announcement_type: 'general', duration: '1' });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['org-announcements', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gym_announcements')
        .select('*')
        .eq('created_by', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createAnnouncement = useMutation({
    mutationFn: async () => {
      // Default to 1 day if duration is empty/invalid
      let expires_at: string | null = null;
      if (form.duration !== 'never') {
        const days = parseInt(form.duration, 10);
        const finalDays = !isNaN(days) && days > 0 ? days : 1;
        expires_at = new Date(Date.now() + finalDays * 24 * 60 * 60 * 1000).toISOString();
      }

      // Resolve this owner's organization so members of that gym (and only that gym) see it
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user!.id)
        .maybeSingle();

      const { error } = await supabase.from('gym_announcements').insert({
        title: form.title,
        message: form.message,
        priority: form.priority,
        announcement_type: form.announcement_type,
        created_by: user!.id,
        organization_id: org?.id ?? null,
        is_active: true,
        expires_at,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement published');
      setCreateOpen(false);
      setForm({ title: '', message: '', priority: 'normal', announcement_type: 'general', duration: '1' });
    },
    onError: (err: any) => toast.error('Failed: ' + err.message),
  });

  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gym_announcements').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-announcements'] });
      toast.success('Announcement removed');
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          Announcements
        </h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Announcement</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Write your announcement..." rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.announcement_type} onValueChange={v => setForm({ ...form, announcement_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={form.duration} onValueChange={v => setForm({ ...form, duration: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">1 week</SelectItem>
                    <SelectItem value="14">2 weeks</SelectItem>
                    <SelectItem value="30">1 month</SelectItem>
                    <SelectItem value="never">No expiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => createAnnouncement.mutate()} disabled={createAnnouncement.isPending || !form.title.trim() || !form.message.trim()}>
                {createAnnouncement.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Megaphone className="w-4 h-4 mr-2" />}
                Publish Announcement
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {announcements?.map(a => (
          <Card key={a.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{a.title}</p>
                    <Badge variant={a.priority === 'urgent' ? 'destructive' : a.priority === 'high' ? 'secondary' : 'outline'} className="text-[10px]">
                      {a.priority}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{a.announcement_type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{a.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(a.created_at), 'dd MMM yyyy, HH:mm')}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => deleteAnnouncement.mutate(a.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!announcements || announcements.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No announcements yet</p>
              <p className="text-sm mt-1">Create your first announcement to notify members</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
