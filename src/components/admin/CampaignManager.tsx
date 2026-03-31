import { useState } from 'react';
import { useCampaigns, useCreateCampaign, useUpdateCampaign, type Campaign } from '@/hooks/useGrowth';
import { useMembershipPlans } from '@/hooks/useRevenue';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, Tag, Percent, Copy, Check, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CampaignManager() {
  const { data: campaigns, isLoading } = useCampaigns();
  const { data: plans } = useMembershipPlans();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', campaign_type: 'discount',
    discount_percentage: 0, discount_amount: 0, applicable_plan_id: '',
    start_date: new Date().toISOString().split('T')[0], end_date: '',
    is_active: true, promo_code: '', max_redemptions: 0,
  });

  const resetForm = () => {
    setForm({
      title: '', description: '', campaign_type: 'discount',
      discount_percentage: 0, discount_amount: 0, applicable_plan_id: '',
      start_date: new Date().toISOString().split('T')[0], end_date: '',
      is_active: true, promo_code: '', max_redemptions: 0,
    });
  };

  const generatePromoCode = () => {
    const code = 'FIT' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setForm({ ...form, promo_code: code });
  };

  const handleSave = async () => {
    await createCampaign.mutateAsync({
      ...form,
      applicable_plan_id: form.applicable_plan_id || null,
      end_date: form.end_date || null,
      max_redemptions: form.max_redemptions || null,
    } as any);
    setSheetOpen(false);
    resetForm();
  };

  const copyPromoCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Promo code copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-base">Campaigns & Offers</h3>
        <Sheet open={sheetOpen} onOpenChange={(o) => { setSheetOpen(o); if (!o) resetForm(); }}>
          <SheetTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs h-8">
              <Plus className="w-3.5 h-3.5" /> New Campaign
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
            <SheetHeader><SheetTitle>Create Campaign</SheetTitle></SheetHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Campaign Title *</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. New Year Offer" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Campaign details..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select value={form.campaign_type} onValueChange={v => setForm({ ...form, campaign_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="free_trial">Free Trial</SelectItem>
                    <SelectItem value="referral_bonus">Referral Bonus</SelectItem>
                    <SelectItem value="seasonal">Seasonal Offer</SelectItem>
                    <SelectItem value="flash_sale">Flash Sale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Discount %</Label>
                  <Input type="number" value={form.discount_percentage} onChange={e => setForm({ ...form, discount_percentage: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Flat Off (₹)</Label>
                  <Input type="number" value={form.discount_amount} onChange={e => setForm({ ...form, discount_amount: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Applicable Plan</Label>
                <Select value={form.applicable_plan_id} onValueChange={v => setForm({ ...form, applicable_plan_id: v })}>
                  <SelectTrigger><SelectValue placeholder="All plans" /></SelectTrigger>
                  <SelectContent>
                    {plans?.filter(p => p.is_active).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Promo Code</Label>
                <div className="flex gap-2">
                  <Input value={form.promo_code} onChange={e => setForm({ ...form, promo_code: e.target.value.toUpperCase() })} placeholder="FITNEWYEAR" />
                  <Button size="sm" variant="outline" type="button" onClick={generatePromoCode}>Generate</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Start Date</Label>
                  <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">End Date</Label>
                  <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Max Redemptions (0 = unlimited)</Label>
                <Input type="number" value={form.max_redemptions} onChange={e => setForm({ ...form, max_redemptions: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                <Label className="text-xs">Active</Label>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={createCampaign.isPending || !form.title}>
                {createCampaign.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create Campaign
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="space-y-3">
        {campaigns?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No campaigns yet</p>
          </div>
        )}
        {campaigns?.map(campaign => {
          const isExpired = campaign.end_date && new Date(campaign.end_date) < new Date();
          const isMaxed = campaign.max_redemptions && campaign.current_redemptions >= campaign.max_redemptions;
          return (
            <Card key={campaign.id} className={(!campaign.is_active || isExpired) ? 'opacity-60' : ''}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{campaign.title}</p>
                      <Badge variant={campaign.is_active && !isExpired ? 'default' : 'secondary'} className="text-[10px]">
                        {isExpired ? 'Expired' : campaign.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {campaign.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{campaign.description}</p>}

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {campaign.discount_percentage > 0 && (
                        <Badge variant="outline" className="text-[10px] gap-0.5">
                          <Percent className="w-2.5 h-2.5" />{campaign.discount_percentage}% off
                        </Badge>
                      )}
                      {campaign.discount_amount > 0 && (
                        <Badge variant="outline" className="text-[10px]">₹{campaign.discount_amount} off</Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] capitalize">{campaign.campaign_type.replace('_', ' ')}</Badge>
                    </div>

                    {campaign.promo_code && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Tag className="w-3 h-3 text-primary" />
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{campaign.promo_code}</code>
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); copyPromoCode(campaign.promo_code!, campaign.id); }}>
                          {copiedId === campaign.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span>{format(new Date(campaign.start_date), 'MMM d')} {campaign.end_date ? `- ${format(new Date(campaign.end_date), 'MMM d')}` : '→ Ongoing'}</span>
                      {campaign.max_redemptions && (
                        <span className={isMaxed ? 'text-destructive font-medium' : ''}>
                          {campaign.current_redemptions}/{campaign.max_redemptions} used
                        </span>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={campaign.is_active}
                    onCheckedChange={v => updateCampaign.mutate({ id: campaign.id, is_active: v })}
                    className="shrink-0"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
