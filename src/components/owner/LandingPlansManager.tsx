import { useState } from 'react';
import { useGymLandingPlans, useSaveLandingPlan, useDeleteLandingPlan, type LandingPlan } from '@/hooks/useGymLandingPlans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2, Pencil, Trash2, Star, X } from 'lucide-react';

interface Props { organizationId?: string }

const blankPlan = {
  title: '',
  description: '',
  price: 0,
  duration_label: 'per month',
  features: [] as string[],
  is_featured: false,
  is_active: true,
  display_order: 0,
};

export default function LandingPlansManager({ organizationId }: Props) {
  const { data: plans } = useGymLandingPlans(organizationId);
  const save = useSaveLandingPlan(organizationId);
  const del = useDeleteLandingPlan(organizationId);
  const [editing, setEditing] = useState<(typeof blankPlan & { id?: string }) | null>(null);
  const [featureInput, setFeatureInput] = useState('');

  const open = (p?: LandingPlan) => {
    setEditing(p ? {
      id: p.id,
      title: p.title,
      description: p.description || '',
      price: Number(p.price),
      duration_label: p.duration_label,
      features: p.features || [],
      is_featured: p.is_featured,
      is_active: p.is_active,
      display_order: p.display_order,
    } : { ...blankPlan, display_order: (plans?.length || 0) });
    setFeatureInput('');
  };

  const handleSave = async () => {
    if (!editing) return;
    await save.mutateAsync(editing);
    setEditing(null);
  };

  const addFeature = () => {
    const v = featureInput.trim();
    if (!v || !editing) return;
    setEditing({ ...editing, features: [...editing.features, v] });
    setFeatureInput('');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-lg">Public Landing Plans</CardTitle>
          <CardDescription>Pricing shown on your public page</CardDescription>
        </div>
        <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => open()}><Plus className="w-4 h-4 mr-1.5" /> Add Plan</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing?.id ? 'Edit' : 'Add'} Plan</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder="3 Month Premium" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Price (₹)</Label>
                    <Input type="number" value={editing.price} onChange={e => setEditing({ ...editing, price: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration label</Label>
                    <Input value={editing.duration_label} onChange={e => setEditing({ ...editing, duration_label: e.target.value })} placeholder="per month" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea rows={2} value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Features</Label>
                  <div className="flex gap-2">
                    <Input value={featureInput} onChange={e => setFeatureInput(e.target.value)} placeholder="Personal trainer included"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }} />
                    <Button size="icon" onClick={addFeature}><Plus className="w-4 h-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editing.features.map((f, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {f}
                        <button onClick={() => setEditing({ ...editing, features: editing.features.filter((_, j) => j !== i) })}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/40">
                  <div>
                    <p className="text-sm font-medium">Featured</p>
                    <p className="text-xs text-muted-foreground">Highlight this plan</p>
                  </div>
                  <Switch checked={editing.is_featured} onCheckedChange={v => setEditing({ ...editing, is_featured: v })} />
                </div>
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/40">
                  <div>
                    <p className="text-sm font-medium">Active</p>
                    <p className="text-xs text-muted-foreground">Visible on landing page</p>
                  </div>
                  <Switch checked={editing.is_active} onCheckedChange={v => setEditing({ ...editing, is_active: v })} />
                </div>
                <Button className="w-full" onClick={handleSave} disabled={save.isPending || !editing.title}>
                  {save.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Save Plan
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-2">
        {plans?.map(p => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">{p.title}</p>
                {p.is_featured && <Badge variant="default" className="gap-1 text-[10px]"><Star className="w-3 h-3" /> Featured</Badge>}
                {!p.is_active && <Badge variant="outline" className="text-[10px]">Inactive</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">₹{Number(p.price).toLocaleString('en-IN')} {p.duration_label} · {p.features.length} features</p>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => open(p)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => del.mutate(p.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
        {(!plans || plans.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">No landing plans yet. Add your first plan to attract members.</p>
        )}
      </CardContent>
    </Card>
  );
}
