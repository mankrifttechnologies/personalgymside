import { useState } from 'react';
import { useMembershipPlans, useCreatePlan, useUpdatePlan, useDeletePlan, type MembershipPlan } from '@/hooks/useRevenue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Trash2, Loader2, Crown, IndianRupee, X } from 'lucide-react';

export default function MembershipPlansManager() {
  const { data: plans, isLoading } = useMembershipPlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<MembershipPlan | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', duration_days: 30, price: 0,
    plan_type: 'monthly', features: [] as string[], is_active: true,
  });
  const [newFeature, setNewFeature] = useState('');

  const resetForm = () => {
    setForm({ name: '', description: '', duration_days: 30, price: 0, plan_type: 'monthly', features: [], is_active: true });
    setEditing(null);
    setNewFeature('');
  };

  const openEdit = (plan: MembershipPlan) => {
    setEditing(plan);
    setForm({
      name: plan.name, description: plan.description || '', duration_days: plan.duration_days,
      price: plan.price, plan_type: plan.plan_type, features: plan.features || [], is_active: plan.is_active,
    });
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (editing) {
      await updatePlan.mutateAsync({ id: editing.id, ...form });
    } else {
      await createPlan.mutateAsync(form);
    }
    setSheetOpen(false);
    resetForm();
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setForm({ ...form, features: [...form.features, newFeature.trim()] });
      setNewFeature('');
    }
  };

  const removeFeature = (idx: number) => {
    setForm({ ...form, features: form.features.filter((_, i) => i !== idx) });
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-base">Membership Plans</h3>
        <Sheet open={sheetOpen} onOpenChange={(o) => { setSheetOpen(o); if (!o) resetForm(); }}>
          <SheetTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs h-8">
              <Plus className="w-3.5 h-3.5" /> Add Plan
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editing ? 'Edit Plan' : 'New Membership Plan'}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Plan Name</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Gold Plan" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Plan details..." rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Price (₹)</Label>
                  <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Duration (days)</Label>
                  <Input type="number" value={form.duration_days} onChange={e => setForm({ ...form, duration_days: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Plan Type</Label>
                <Select value={form.plan_type} onValueChange={v => setForm({ ...form, plan_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="half_yearly">Half Yearly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Features</Label>
                <div className="flex gap-2">
                  <Input value={newFeature} onChange={e => setNewFeature(e.target.value)} placeholder="e.g. Access to all equipment" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())} />
                  <Button size="sm" variant="outline" onClick={addFeature} type="button">Add</Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.features.map((f, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 text-xs">
                      {f}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeFeature(i)} />
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                <Label className="text-xs">Active</Label>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={createPlan.isPending || updatePlan.isPending || !form.name || !form.price}>
                {(createPlan.isPending || updatePlan.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editing ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="space-y-3">
        {plans?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Crown className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No membership plans yet</p>
          </div>
        )}
        {plans?.map(plan => (
          <Card key={plan.id} className={!plan.is_active ? 'opacity-60' : ''}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{plan.name}</p>
                    <Badge variant={plan.is_active ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <IndianRupee className="w-3.5 h-3.5 text-primary" />
                    <span className="font-bold text-lg text-primary">{plan.price}</span>
                    <span className="text-xs text-muted-foreground">/ {plan.duration_days} days</span>
                  </div>
                  {plan.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{plan.description}</p>}
                  {plan.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {plan.features.slice(0, 3).map((f, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{f as string}</Badge>
                      ))}
                      {plan.features.length > 3 && <Badge variant="outline" className="text-[10px]">+{plan.features.length - 3}</Badge>}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(plan)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deletePlan.mutate(plan.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
