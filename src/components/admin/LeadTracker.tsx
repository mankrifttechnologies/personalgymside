import { useState } from 'react';
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead, type Lead } from '@/hooks/useGrowth';
import { useMembershipPlans } from '@/hooks/useRevenue';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, Phone, Mail, Trash2, UserPlus, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const SOURCES = [
  { value: 'walk_in', label: '🚶 Walk-in' },
  { value: 'referral', label: '🤝 Referral' },
  { value: 'social_media', label: '📱 Social Media' },
  { value: 'google', label: '🔍 Google' },
  { value: 'website', label: '🌐 Website' },
  { value: 'flyer', label: '📄 Flyer/Banner' },
  { value: 'other', label: '📋 Other' },
];

const STATUSES = [
  { value: 'new', label: 'New', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
  { value: 'interested', label: 'Interested', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400' },
  { value: 'trial', label: 'Trial', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400' },
  { value: 'converted', label: 'Converted', color: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  { value: 'lost', label: 'Lost', color: 'bg-red-500/10 text-red-700 dark:text-red-400' },
];

export default function LeadTracker() {
  const { data: leads, isLoading } = useLeads();
  const { data: plans } = useMembershipPlans();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    name: '', phone: '', email: '', source: 'walk_in',
    status: 'new', interested_plan_id: '', notes: '', follow_up_date: '',
  });

  const resetForm = () => {
    setForm({ name: '', phone: '', email: '', source: 'walk_in', status: 'new', interested_plan_id: '', notes: '', follow_up_date: '' });
  };

  const handleSave = async () => {
    await createLead.mutateAsync({
      ...form,
      interested_plan_id: form.interested_plan_id || null,
      follow_up_date: form.follow_up_date || null,
    } as any);
    setSheetOpen(false);
    resetForm();
  };

  const handleStatusChange = (lead: Lead, newStatus: string) => {
    updateLead.mutate({
      id: lead.id,
      status: newStatus,
      ...(newStatus === 'converted' ? { converted_at: new Date().toISOString() } : {}),
    } as any);
  };

  const filteredLeads = leads?.filter(l => filter === 'all' || l.status === filter) || [];
  const todayFollowUps = leads?.filter(l => {
    if (!l.follow_up_date) return false;
    return new Date(l.follow_up_date).toDateString() === new Date().toDateString() && l.status !== 'converted' && l.status !== 'lost';
  }) || [];

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Follow-up Alert */}
      {todayFollowUps.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs font-medium">{todayFollowUps.length} follow-up{todayFollowUps.length > 1 ? 's' : ''} scheduled today</p>
            </div>
            <div className="mt-2 space-y-1">
              {todayFollowUps.slice(0, 3).map(l => (
                <p key={l.id} className="text-[10px] text-muted-foreground">• {l.name} {l.phone ? `(${l.phone})` : ''}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-base">Leads ({leads?.length || 0})</h3>
        <Sheet open={sheetOpen} onOpenChange={(o) => { setSheetOpen(o); if (!o) resetForm(); }}>
          <SheetTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs h-8">
              <Plus className="w-3.5 h-3.5" /> Add Lead
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
            <SheetHeader><SheetTitle>Add New Lead</SheetTitle></SheetHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone</Label>
                  <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Source</Label>
                  <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Follow-up Date</Label>
                  <Input type="date" value={form.follow_up_date} onChange={e => setForm({ ...form, follow_up_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Interested Plan</Label>
                <Select value={form.interested_plan_id} onValueChange={v => setForm({ ...form, interested_plan_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                  <SelectContent>
                    {plans?.filter(p => p.is_active).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} - ₹{p.price}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any additional info..." />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={createLead.isPending || !form.name}>
                {createLead.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Add Lead
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} className="text-[10px] h-7 shrink-0" onClick={() => setFilter('all')}>All</Button>
        {STATUSES.map(s => (
          <Button key={s.value} size="sm" variant={filter === s.value ? 'default' : 'outline'} className="text-[10px] h-7 shrink-0" onClick={() => setFilter(s.value)}>
            {s.label}
          </Button>
        ))}
      </div>

      {/* Lead Detail Sheet */}
      <Sheet open={!!detailLead} onOpenChange={(o) => { if (!o) setDetailLead(null); }}>
        <SheetContent side="bottom" className="h-[70vh] overflow-y-auto">
          {detailLead && (
            <>
              <SheetHeader><SheetTitle>{detailLead.name}</SheetTitle></SheetHeader>
              <div className="space-y-4 pt-4">
                <div className="flex gap-2 flex-wrap">
                  {detailLead.phone && (
                    <a href={`tel:${detailLead.phone}`}>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs"><Phone className="w-3.5 h-3.5" />Call</Button>
                    </a>
                  )}
                  {detailLead.email && (
                    <a href={`mailto:${detailLead.email}`}>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs"><Mail className="w-3.5 h-3.5" />Email</Button>
                    </a>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={detailLead.status} onValueChange={v => { handleStatusChange(detailLead, v); setDetailLead({ ...detailLead, status: v }); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {detailLead.notes && (
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <p className="text-sm text-muted-foreground mt-1">{detailLead.notes}</p>
                  </div>
                )}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Source: {SOURCES.find(s => s.value === detailLead.source)?.label || detailLead.source}</p>
                  <p>Added: {format(new Date(detailLead.created_at), 'MMM d, yyyy')}</p>
                  {detailLead.follow_up_date && <p>Follow-up: {format(new Date(detailLead.follow_up_date), 'MMM d, yyyy')}</p>}
                </div>
                <Button variant="destructive" size="sm" className="w-full" onClick={() => { deleteLead.mutate(detailLead.id); setDetailLead(null); }}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Lead
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Leads List */}
      <div className="space-y-2">
        {filteredLeads.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <UserPlus className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No leads found</p>
          </div>
        )}
        {filteredLeads.map(lead => {
          const statusInfo = STATUSES.find(s => s.value === lead.status);
          const isFollowUpToday = lead.follow_up_date && new Date(lead.follow_up_date).toDateString() === new Date().toDateString();
          return (
            <Card key={lead.id} className={`cursor-pointer active:scale-[0.98] transition-all ${isFollowUpToday ? 'border-primary/50' : ''}`} onClick={() => setDetailLead(lead)}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{lead.name}</p>
                      <Badge className={`text-[10px] ${statusInfo?.color || ''}`}>{statusInfo?.label || lead.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {lead.phone && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{lead.phone}</span>}
                      <span className="text-[10px] text-muted-foreground">{SOURCES.find(s => s.value === lead.source)?.label}</span>
                    </div>
                    {isFollowUpToday && (
                      <Badge variant="outline" className="text-[10px] mt-1.5 border-primary/50 text-primary">📅 Follow-up today</Badge>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
