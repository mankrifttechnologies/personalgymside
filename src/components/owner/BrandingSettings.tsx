import { useState, useEffect, useRef } from 'react';
import { useOrgBranding, useUpsertOrgBranding, uploadBrandAsset } from '@/hooks/useOrgBranding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, X, Palette, Plus, ImageIcon, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';
import LandingPlansManager from './LandingPlansManager';

interface Props {
  organizationId?: string;
  gymCode?: string;
}

export default function BrandingSettings({ organizationId, gymCode }: Props) {
  const { data: branding, isLoading } = useOrgBranding(organizationId);
  const upsert = useUpsertOrgBranding(organizationId);
  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const [form, setForm] = useState({
    logo_url: '',
    cover_image_url: '',
    brand_color: '#6366f1',
    tagline: '',
    about: '',
    amenities: [] as string[],
    gallery_urls: [] as string[],
    whatsapp_number: '',
    instagram_handle: '',
    facebook_url: '',
    google_maps_url: '',
    gst_number: '',
    upi_vpa: '',
    upi_payee_name: '',
    invoice_prefix: 'INV',
  });
  const [amenityInput, setAmenityInput] = useState('');

  useEffect(() => {
    if (branding) {
      setForm({
        logo_url: branding.logo_url || '',
        cover_image_url: branding.cover_image_url || '',
        brand_color: branding.brand_color || '#6366f1',
        tagline: branding.tagline || '',
        about: branding.about || '',
        amenities: branding.amenities || [],
        gallery_urls: branding.gallery_urls || [],
        whatsapp_number: branding.whatsapp_number || '',
        instagram_handle: branding.instagram_handle || '',
        facebook_url: branding.facebook_url || '',
        google_maps_url: branding.google_maps_url || '',
        gst_number: branding.gst_number || '',
        upi_vpa: branding.upi_vpa || '',
        upi_payee_name: branding.upi_payee_name || '',
        invoice_prefix: branding.invoice_prefix || 'INV',
      });
    }
  }, [branding]);

  const handleUpload = async (file: File, kind: 'logo' | 'cover' | 'gallery') => {
    if (!organizationId) return;
    setUploading(kind);
    try {
      const url = await uploadBrandAsset(organizationId, file, kind);
      if (kind === 'logo') setForm(f => ({ ...f, logo_url: url }));
      else if (kind === 'cover') setForm(f => ({ ...f, cover_image_url: url }));
      else setForm(f => ({ ...f, gallery_urls: [...f.gallery_urls, url] }));
      toast.success('Uploaded');
    } catch (e: any) {
      toast.error('Upload failed: ' + e.message);
    } finally {
      setUploading(null);
    }
  };

  const addAmenity = () => {
    const v = amenityInput.trim();
    if (!v) return;
    setForm(f => ({ ...f, amenities: [...f.amenities, v] }));
    setAmenityInput('');
  };

  const handleSave = () => upsert.mutate(form as any);

  const landingUrl = gymCode ? `${window.location.origin}/g/${gymCode}` : '';

  if (!organizationId) {
    return <Card><CardContent className="p-8 text-center text-muted-foreground">No organization found</CardContent></Card>;
  }
  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {gymCode && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Public landing page</p>
              <p className="text-sm font-mono truncate">{landingUrl}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(landingUrl); toast.success('Link copied'); }}>
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
              </Button>
              <a href={landingUrl} target="_blank" rel="noreferrer">
                <Button size="sm"><ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Palette className="w-5 h-5 text-primary" /> Brand Identity</CardTitle>
          <CardDescription>Logo, colors & tagline shown on your public page and member app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="logo" className="w-16 h-16 rounded-lg object-cover border" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center"><ImageIcon className="w-6 h-6 text-muted-foreground" /></div>
                )}
                <input ref={logoInput} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'logo')} />
                <Button size="sm" variant="outline" onClick={() => logoInput.current?.click()} disabled={uploading === 'logo'}>
                  {uploading === 'logo' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
                  Upload
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Brand Color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.brand_color} onChange={e => setForm({ ...form, brand_color: e.target.value })} className="h-10 w-16 rounded border bg-transparent" />
                <Input value={form.brand_color} onChange={e => setForm({ ...form, brand_color: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cover Image</Label>
            {form.cover_image_url && (
              <img src={form.cover_image_url} alt="cover" className="w-full h-32 object-cover rounded-lg border" />
            )}
            <input ref={coverInput} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'cover')} />
            <Button size="sm" variant="outline" onClick={() => coverInput.current?.click()} disabled={uploading === 'cover'}>
              {uploading === 'cover' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
              {form.cover_image_url ? 'Replace' : 'Upload'} cover
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} placeholder="Train hard. Live strong." maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label>About</Label>
            <Textarea rows={4} value={form.about} onChange={e => setForm({ ...form, about: e.target.value })} placeholder="Tell prospects about your gym..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Amenities</CardTitle>
          <CardDescription>Listed on your public page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={amenityInput} onChange={e => setAmenityInput(e.target.value)} placeholder="e.g. Free parking, AC, Steam"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity(); } }} />
            <Button size="icon" onClick={addAmenity}><Plus className="w-4 h-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.amenities.map((a, i) => (
              <Badge key={i} variant="secondary" className="gap-1">
                {a}
                <button onClick={() => setForm(f => ({ ...f, amenities: f.amenities.filter((_, j) => j !== i) }))}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {form.amenities.length === 0 && <p className="text-xs text-muted-foreground">No amenities added</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gallery</CardTitle>
          <CardDescription>Photos of your gym for the public page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {form.gallery_urls.map((url, i) => (
              <div key={i} className="relative aspect-square">
                <img src={url} alt="" className="w-full h-full object-cover rounded-lg border" />
                <button onClick={() => setForm(f => ({ ...f, gallery_urls: f.gallery_urls.filter((_, j) => j !== i) }))}
                  className="absolute top-1 right-1 bg-background/90 rounded-full p-0.5 shadow-sm">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button onClick={() => galleryInput.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors">
              {uploading === 'gallery' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              <span className="text-[10px] mt-1">Add</span>
            </button>
          </div>
          <input ref={galleryInput} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'gallery')} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact & Social</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>WhatsApp Number</Label>
            <Input value={form.whatsapp_number} onChange={e => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="+91 98765 43210" />
          </div>
          <div className="space-y-2">
            <Label>Instagram Handle</Label>
            <Input value={form.instagram_handle} onChange={e => setForm({ ...form, instagram_handle: e.target.value })} placeholder="@yourgym" />
          </div>
          <div className="space-y-2">
            <Label>Facebook URL</Label>
            <Input value={form.facebook_url} onChange={e => setForm({ ...form, facebook_url: e.target.value })} placeholder="https://facebook.com/..." />
          </div>
          <div className="space-y-2">
            <Label>Google Maps URL</Label>
            <Input value={form.google_maps_url} onChange={e => setForm({ ...form, google_maps_url: e.target.value })} placeholder="https://maps.google.com/..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Billing & Tax</CardTitle>
          <CardDescription>Used on GST invoices and UPI QR for member payments</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>GSTIN</Label>
            <Input value={form.gst_number} onChange={e => setForm({ ...form, gst_number: e.target.value.toUpperCase() })} placeholder="22AAAAA0000A1Z5" maxLength={15} />
          </div>
          <div className="space-y-2">
            <Label>Invoice Prefix</Label>
            <Input value={form.invoice_prefix} onChange={e => setForm({ ...form, invoice_prefix: e.target.value.toUpperCase() })} placeholder="INV" maxLength={6} />
          </div>
          <div className="space-y-2">
            <Label>UPI VPA</Label>
            <Input value={form.upi_vpa} onChange={e => setForm({ ...form, upi_vpa: e.target.value })} placeholder="yourgym@hdfc" />
          </div>
          <div className="space-y-2">
            <Label>UPI Payee Name</Label>
            <Input value={form.upi_payee_name} onChange={e => setForm({ ...form, upi_payee_name: e.target.value })} placeholder="Gold's Gym" />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={upsert.isPending} size="lg" className="w-full">
        {upsert.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Save Branding
      </Button>

      <LandingPlansManager organizationId={organizationId} />
    </div>
  );
}
