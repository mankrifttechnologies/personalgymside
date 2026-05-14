import { useState, useMemo } from 'react';
import { useTrials, useCreateTrial, useUpdateTrialStatus, useDeleteTrial, type Trial } from '@/hooks/useTrials';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, Phone, MessageCircle, CheckCircle2, XCircle, Clock, Trash2 } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { buildWhatsAppShareUrl } from '@/lib/upi';

interface Props {
  organizationId?: string;
}

export default function TrialsTab({ organizationId }: Props) {
  const { data: trials, isLoading } = useTrials(organizationId);
  const createTrial = useCreateTrial();
  const updateStatus = useUpdateTrialStatus();
  const deleteTrial = useDeleteTrial();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    prospect_name: '',
    prospect_phone: '',
    duration_days: '7',
    notes: '',
  });

  const buckets = useMemo(() => {
    const active: Trial[] = [];
    const converted: Trial[] = [];
    const lost: Trial[] = [];
    (trials || []).forEach(t => {
      if (t.status === 'active') active.push(t);
      else if (t.status === 'converted') converted.push(t);
      else lost.push(t);
    });
    return { active, converted, lost };
  }, [trials]);

  const stats = useMemo(() => {
    const total = (trials || []).length;
    const conv = buckets.converted.length;
    return {
      total,
      active: buckets.active.length,
      converted: conv,
      conversionRate: total ? Math.round((conv / total) * 100) : 0,
    };
  }, [trials, buckets]);

  if (!organizationId) return <p className="text-sm text-muted-foreground">No organization selected.</p>;

  const handleCreate = async () => {
    if (!form.prospect_name || !form.duration_days) return;
    await createTrial.mutateAsync({
      organization_id: organizationId,
      prospect_name: form.prospect_name,
      prospect_phone: form.prospect_phone,
      duration_days: parseInt(form.duration_days, 10),
      notes: form.notes,
    });
    setOpen(false);
    setForm({ prospect_name: '', prospect_phone: '', duration_days: '7', notes: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Trial Pipeline</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Start Trial</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Start a Free Trial</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5"><Label>Prospect name</Label>
                <Input value={form.prospect_name} onChange={e => setForm({ ...form, prospect_name: e.target.value })} />
              </div>
              <div className="space-y-1.5"><Label>Phone (optional)</Label>
                <Input value={form.prospect_phone} onChange={e => setForm({ ...form, prospect_phone: e.target.value })} placeholder="+91..." />
              </div>
              <div className="space-y-1.5"><Label>Trial duration</Label>
                <Select value={form.duration_days} onValueChange={v => setForm({ ...form, duration_days: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Notes</Label>
                <Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={createTrial.isPending}>
                {createTrial.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Start Trial
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">{stats.total}</p><p className="text-[10px] text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-blue-500">{stats.active}</p><p className="text-[10px] text-muted-foreground">Active</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-green-500">{stats.converted}</p><p className="text-[10px] text-muted-foreground">Converted</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-primary">{stats.conversionRate}%</p><p className="text-[10px] text-muted-foreground">Conv. Rate</p></CardContent></Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-4">
          <TrialBucket title="Active Trials" trials={buckets.active} variant="active"
            onConvert={id => updateStatus.mutate({ id, status: 'converted' })}
            onLose={id => updateStatus.mutate({ id, status: 'lost' })}
            onDelete={id => deleteTrial.mutate(id)} />
          <TrialBucket title="Converted" trials={buckets.converted} variant="converted"
            onDelete={id => deleteTrial.mutate(id)} />
          <TrialBucket title="Lost" trials={buckets.lost} variant="lost"
            onDelete={id => deleteTrial.mutate(id)} />
        </div>
      )}
    </div>
  );
}

function TrialBucket({ title, trials, variant, onConvert, onLose, onDelete }: {
  title: string;
  trials: Trial[];
  variant: 'active' | 'converted' | 'lost';
  onConvert?: (id: string) => void;
  onLose?: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (!trials.length) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title} ({trials.length})</h3>
      {trials.map(t => {
        const daysLeft = differenceInDays(new Date(t.end_date), new Date());
        const expired = daysLeft < 0;
        return (
          <Card key={t.id}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{t.prospect_name}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      <Clock className="w-2.5 h-2.5 mr-1" />
                      {variant === 'active'
                        ? expired ? 'Expired' : `${daysLeft}d left`
                        : `Ended ${format(new Date(t.end_date), 'dd MMM')}`}
                    </Badge>
                    {t.prospect_phone && (
                      <Badge variant="secondary" className="text-[10px]"><Phone className="w-2.5 h-2.5 mr-1" />{t.prospect_phone}</Badge>
                    )}
                  </div>
                  {t.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.notes}</p>}
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => onDelete(t.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              {variant === 'active' && (
                <div className="grid grid-cols-3 gap-1.5">
                  {t.prospect_phone && (
                    <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" asChild>
                      <a href={buildWhatsAppShareUrl(t.prospect_phone, `Hi ${t.prospect_name}, your free trial ends ${expired ? 'soon' : `in ${daysLeft} days`}. Ready to join?`)} target="_blank" rel="noreferrer">
                        <MessageCircle className="w-3 h-3" /> Nudge
                      </a>
                    </Button>
                  )}
                  <Button size="sm" className="h-7 text-[10px] gap-1" onClick={() => onConvert?.(t.id)}>
                    <CheckCircle2 className="w-3 h-3" /> Convert
                  </Button>
                  <Button size="sm" variant="destructive" className="h-7 text-[10px] gap-1" onClick={() => onLose?.(t.id)}>
                    <XCircle className="w-3 h-3" /> Lost
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
