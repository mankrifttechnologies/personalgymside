import { useState } from 'react';
import { useGymClasses } from '@/hooks/useClassBookings';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Clock, MapPin, Users, Trash2, Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CLASS_TYPES = ['yoga', 'hiit', 'spinning', 'pilates', 'boxing', 'group', 'strength', 'dance', 'cardio'];

interface ClassForm {
  title: string;
  description: string;
  class_type: string;
  instructor_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  capacity: number;
  location: string;
  is_active: boolean;
}

const emptyForm: ClassForm = {
  title: '',
  description: '',
  class_type: 'group',
  instructor_name: '',
  day_of_week: 1,
  start_time: '09:00',
  end_time: '10:00',
  capacity: 20,
  location: 'Main Hall',
  is_active: true,
};

export default function AdminClassManager() {
  const { data: classes, isLoading } = useGymClasses();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ClassForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Class title is required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('gym_classes')
          .update(form)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Class updated!');
      } else {
        const { error } = await supabase
          .from('gym_classes')
          .insert(form);
        if (error) throw error;
        toast.success('Class created! 🎉');
      }
      queryClient.invalidateQueries({ queryKey: ['gym-classes'] });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save class');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cls: any) => {
    setForm({
      title: cls.title,
      description: cls.description || '',
      class_type: cls.class_type,
      instructor_name: cls.instructor_name || '',
      day_of_week: cls.day_of_week,
      start_time: cls.start_time?.slice(0, 5) || '09:00',
      end_time: cls.end_time?.slice(0, 5) || '10:00',
      capacity: cls.capacity,
      location: cls.location || '',
      is_active: cls.is_active,
    });
    setEditingId(cls.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('gym_classes').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete class');
    } else {
      toast.success('Class deleted');
      queryClient.invalidateQueries({ queryKey: ['gym-classes'] });
    }
  };

  const handleOpenNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold">Classes ({classes?.length || 0})</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" onClick={handleOpenNew}>
              <Plus className="w-4 h-4" /> Add Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Class' : 'Create New Class'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Morning Yoga Flow" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What to expect in this class..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class Type</Label>
                  <Select value={form.class_type} onValueChange={v => setForm({ ...form, class_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CLASS_TYPES.map(t => (
                        <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Day</Label>
                  <Select value={String(form.day_of_week)} onValueChange={v => setForm({ ...form, day_of_week: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d, i) => (
                        <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })} min={1} />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Main Hall" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Instructor Name</Label>
                <Input value={form.instructor_name} onChange={e => setForm({ ...form, instructor_name: e.target.value })} placeholder="Trainer name" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              </div>
              <Button variant="energy" className="w-full" onClick={handleSave} disabled={saving || !form.title.trim()}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingId ? 'Update Class' : 'Create Class'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(classes?.length || 0) === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No classes created yet</p>
          <p className="text-sm">Click "Add Class" to create your first group session</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes?.map((cls: any) => (
            <Card key={cls.id} className={`glass border-border ${!cls.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold">{cls.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="capitalize">{cls.class_type}</Badge>
                      {!cls.is_active && <Badge variant="destructive">Inactive</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(cls)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(cls.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span>{DAYS[cls.day_of_week]}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {cls.start_time?.slice(0, 5)} - {cls.end_time?.slice(0, 5)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {cls.capacity}
                  </span>
                  {cls.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {cls.location}
                    </span>
                  )}
                </div>
                {cls.instructor_name && <p className="text-xs text-muted-foreground mt-1">Instructor: {cls.instructor_name}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
