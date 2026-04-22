import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useDunningRules,
  useUpsertDunningRule,
  useDeleteDunningRule,
  type DunningRule,
} from '@/hooks/useDunning';
import { Plus, Trash2, Edit, AlertCircle, MessageSquare, Phone, Bell } from 'lucide-react';

const DEFAULTS: Partial<DunningRule>[] = [
  { name: '3 days before due', days_offset: -3, message_template: 'Hi {name}, your gym membership payment of {amount} is due in 3 days. Please make payment to avoid interruption. Thank you!', channels: ['in_app', 'whatsapp'], is_active: true },
  { name: 'On due date', days_offset: 0, message_template: 'Hi {name}, your payment of {amount} is due today. Kindly settle to keep your membership active.', channels: ['in_app', 'whatsapp'], is_active: true },
  { name: '7 days overdue', days_offset: 7, message_template: 'Hi {name}, your payment of {amount} is now {days} days overdue. Please settle immediately to avoid suspension.', channels: ['in_app', 'whatsapp', 'sms'], is_active: true, auto_suspend_after_days: 14 },
];

interface Props {
  organizationId: string;
}

export default function DunningRulesManager({ organizationId }: Props) {
  const { data: rules = [], isLoading } = useDunningRules(organizationId);
  const upsert = useUpsertDunningRule();
  const del = useDeleteDunningRule();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<DunningRule> | null>(null);

  const openNew = () => {
    setEditing({
      organization_id: organizationId,
      name: '',
      days_offset: 0,
      message_template: 'Hi {name}, your payment of {amount} is due. Please settle.',
      channels: ['in_app'],
      is_active: true,
      auto_suspend_after_days: null,
    });
    setOpen(true);
  };

  const openEdit = (r: DunningRule) => {
    setEditing(r);
    setOpen(true);
  };

  const save = async () => {
    if (!editing?.name || !editing.message_template) return;
    await upsert.mutateAsync(editing as any);
    setOpen(false);
    setEditing(null);
  };

  const seedDefaults = async () => {
    for (const r of DEFAULTS) {
      await upsert.mutateAsync({ ...r, organization_id: organizationId } as any);
    }
  };

  const toggleChannel = (ch: string) => {
    if (!editing) return;
    const set = new Set(editing.channels ?? []);
    if (set.has(ch)) set.delete(ch);
    else set.add(ch);
    setEditing({ ...editing, channels: [...set] });
  };

  const channelIcon = (c: string) => {
    if (c === 'whatsapp') return <MessageSquare className="w-3 h-3" />;
    if (c === 'sms') return <Phone className="w-3 h-3" />;
    return <Bell className="w-3 h-3" />;
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-400" />
            Dunning Rules
          </CardTitle>
          <div className="flex gap-2">
            {rules.length === 0 && (
              <Button size="sm" variant="outline" onClick={seedDefaults} disabled={upsert.isPending}>
                Use defaults
              </Button>
            )}
            <Button size="sm" onClick={openNew} className="gap-1">
              <Plus className="w-3.5 h-3.5" /> New
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No rules yet. Click "Use defaults" to create a 3-day reminder cadence.
          </p>
        ) : (
          rules.map(r => (
            <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{r.name}</p>
                  <Badge variant={r.is_active ? 'default' : 'outline'} className="text-[10px]">
                    {r.is_active ? 'Active' : 'Off'}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {r.days_offset < 0 ? `${Math.abs(r.days_offset)}d before` : r.days_offset === 0 ? 'On due' : `${r.days_offset}d after`}
                  </Badge>
                  {r.channels.map(c => (
                    <Badge key={c} variant="outline" className="text-[10px] gap-1">
                      {channelIcon(c)} {c}
                    </Badge>
                  ))}
                  {r.auto_suspend_after_days != null && (
                    <Badge variant="destructive" className="text-[10px]">
                      Auto-suspend @ {r.auto_suspend_after_days}d
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.message_template}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}>
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => del.mutate(r.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Rule' : 'New Dunning Rule'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input value={editing.name ?? ''} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. 3 days before due" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Days offset (negative = before due, positive = after)</Label>
                <Input
                  type="number"
                  value={editing.days_offset ?? 0}
                  onChange={e => setEditing({ ...editing, days_offset: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Message template</Label>
                <Textarea
                  rows={4}
                  value={editing.message_template ?? ''}
                  onChange={e => setEditing({ ...editing, message_template: e.target.value })}
                  placeholder="Use {name}, {amount}, {days}, {due_date}"
                />
                <p className="text-[10px] text-muted-foreground">
                  Variables: <code>{'{name}'}</code>, <code>{'{amount}'}</code>, <code>{'{days}'}</code>, <code>{'{due_date}'}</code>
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Channels</Label>
                <div className="flex gap-3 flex-wrap">
                  {['in_app', 'whatsapp', 'sms'].map(ch => (
                    <label key={ch} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <Checkbox
                        checked={editing.channels?.includes(ch) ?? false}
                        onCheckedChange={() => toggleChannel(ch)}
                      />
                      {ch}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Auto-suspend after days overdue (optional)</Label>
                <Input
                  type="number"
                  value={editing.auto_suspend_after_days ?? ''}
                  onChange={e => setEditing({ ...editing, auto_suspend_after_days: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Leave blank to disable"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={editing.is_active ?? true} onCheckedChange={v => setEditing({ ...editing, is_active: v })} />
                  Active
                </label>
                <Button onClick={save} disabled={upsert.isPending || !editing.name || !editing.message_template}>
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
