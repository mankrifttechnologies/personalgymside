import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Wrench, Plus, Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EquipmentTracker() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'cardio',
    location: '',
    status: 'operational',
    notes: '',
    next_maintenance_date: '',
  });

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const addEquipment = useMutation({
    mutationFn: async (eq: typeof form) => {
      const { error } = await supabase.from('equipment').insert({
        name: eq.name,
        category: eq.category,
        location: eq.location || null,
        status: eq.status,
        notes: eq.notes || null,
        next_maintenance_date: eq.next_maintenance_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setDialogOpen(false);
      setForm({ name: '', category: 'cardio', location: '', status: 'operational', notes: '', next_maintenance_date: '' });
      toast.success('Equipment added');
    },
    onError: () => toast.error('Failed to add equipment'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === 'operational') {
        updates.last_maintenance_date = new Date().toISOString().split('T')[0];
      }
      const { error } = await supabase.from('equipment').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Status updated');
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
      case 'needs_maintenance': return <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />;
      case 'out_of_order': return <XCircle className="w-3.5 h-3.5 text-destructive" />;
      default: return <Wrench className="w-3.5 h-3.5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'operational': return 'OK';
      case 'needs_maintenance': return 'Maintenance';
      case 'out_of_order': return 'Down';
      default: return status;
    }
  };

  const needsMaintenance = equipment?.filter(e => e.status !== 'operational').length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">Equipment ({equipment?.length || 0})</h2>
          {needsMaintenance > 0 && (
            <Badge variant="destructive" className="text-[10px]">{needsMaintenance} issues</Badge>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 h-8 text-xs rounded-lg">
              <Plus className="w-3.5 h-3.5" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Equipment</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Treadmill #1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="free_weights">Free Weights</SelectItem>
                      <SelectItem value="machines">Machines</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Location</Label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Floor 1" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Next Maintenance</Label>
                <Input type="date" value={form.next_maintenance_date} onChange={(e) => setForm({ ...form, next_maintenance_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes..." rows={2} />
              </div>
              <Button className="w-full h-11 rounded-xl" onClick={() => addEquipment.mutate(form)} disabled={addEquipment.isPending || !form.name}>
                {addEquipment.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Equipment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : equipment?.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <Wrench className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">No equipment tracked yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {equipment?.map(eq => (
            <Card key={eq.id}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(eq.status)}
                      <span className="font-medium text-sm truncate">{eq.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[9px] px-1.5">{eq.category}</Badge>
                      {eq.location && <span className="text-[10px] text-muted-foreground">{eq.location}</span>}
                    </div>
                    {eq.next_maintenance_date && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Next maintenance: {format(new Date(eq.next_maintenance_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <Select
                    value={eq.status}
                    onValueChange={(v) => updateStatus.mutate({ id: eq.id, status: v })}
                  >
                    <SelectTrigger className="w-28 h-7 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="needs_maintenance">Needs Fix</SelectItem>
                      <SelectItem value="out_of_order">Out of Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
