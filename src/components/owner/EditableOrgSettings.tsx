import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Save, Loader2 } from 'lucide-react';
import MembershipPlansManager from '@/components/admin/MembershipPlansManager';

interface OrgSettingsProps {
  organization: any;
  onUpdate: () => void;
}

export default function EditableOrgSettings({ organization, onUpdate }: OrgSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: organization?.name || '',
    address: organization?.address || '',
    phone: organization?.phone || '',
    email: organization?.email || '',
    website: organization?.website || '',
  });

  if (!organization) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No organization found</p>
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: form.name,
          address: form.address || null,
          phone: form.phone || null,
          email: form.email || null,
          website: form.website || null,
        })
        .eq('id', organization.id);
      if (error) throw error;
      toast.success('Organization details updated');
      onUpdate();
    } catch (err: any) {
      toast.error('Failed to update: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Organization Details</CardTitle>
          <CardDescription>Update your gym information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Gym Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Gym name" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="gym@example.com" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Website</Label>
              <Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://mygym.com" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="w-full sm:w-auto gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
