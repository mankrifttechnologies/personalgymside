import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Phone, Instagram, Facebook, MessageCircle, Check, Star, Dumbbell, ArrowRight } from 'lucide-react';

export default function GymLanding() {
  const { gymCode } = useParams<{ gymCode: string }>();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<any>(null);
  const [branding, setBranding] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    document.title = org?.name ? `${org.name} — Join Today` : 'Join Gym';
    const meta = document.querySelector('meta[name="description"]');
    if (meta && branding?.tagline) meta.setAttribute('content', branding.tagline);
  }, [org, branding]);

  useEffect(() => {
    if (!gymCode) return;
    (async () => {
      setLoading(true);
      const { data: orgs } = await supabase.rpc('get_org_by_gym_code', { code: gymCode });
      const o = orgs?.[0];
      if (!o) { setOrg(null); setLoading(false); return; }
      // Fetch full org row + branding + plans
      const [{ data: fullOrg }, { data: brand }, { data: ps }] = await Promise.all([
        supabase.from('organizations').select('*').eq('id', o.id).maybeSingle(),
        supabase.from('organization_branding').select('*').eq('organization_id', o.id).maybeSingle(),
        supabase.from('gym_landing_plans').select('*').eq('organization_id', o.id).eq('is_active', true).order('display_order'),
      ]);
      setOrg(fullOrg);
      setBranding(brand);
      setPlans(ps || []);
      setLoading(false);
    })();
  }, [gymCode]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!org) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h1 className="text-xl font-bold">Gym not found</h1>
          <p className="text-muted-foreground text-sm mt-1">The gym code "{gymCode}" doesn't match any active gym.</p>
          <Link to="/"><Button variant="outline" className="mt-4">Go Home</Button></Link>
        </div>
      </div>
    );
  }

  const brandColor = branding?.brand_color || 'hsl(var(--primary))';
  const whatsappLink = branding?.whatsapp_number
    ? `https://wa.me/${branding.whatsapp_number.replace(/\D/g, '')}?text=Hi%2C%20I'd%20like%20to%20join%20${encodeURIComponent(org.name)}`
    : null;

  return (
    <div className="min-h-screen bg-background" style={{ ['--brand' as any]: brandColor }}>
      {/* Hero */}
      <section className="relative">
        {branding?.cover_image_url ? (
          <div className="h-64 sm:h-80 md:h-96 w-full relative">
            <img src={branding.cover_image_url} alt={org.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
        ) : (
          <div className="h-48 w-full" style={{ background: `linear-gradient(135deg, ${brandColor}, hsl(var(--primary)))` }} />
        )}
        <div className="max-w-5xl mx-auto px-4 -mt-20 relative">
          <div className="flex items-end gap-4">
            {branding?.logo_url ? (
              <img src={branding.logo_url} alt="logo" className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-background shadow-xl object-cover bg-card" />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-background shadow-xl flex items-center justify-center" style={{ background: brandColor }}>
                <Dumbbell className="w-10 h-10 text-white" />
              </div>
            )}
            <div className="flex-1 pb-2 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">{org.name}</h1>
              {branding?.tagline && <p className="text-muted-foreground text-sm sm:text-base truncate">{branding.tagline}</p>}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* CTAs */}
        <div className="flex flex-wrap gap-3">
          <Link to={`/join-gym?code=${gymCode}`}>
            <Button size="lg" style={{ backgroundColor: brandColor }} className="gap-2 text-white hover:opacity-90">
              Join Now <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          {whatsappLink && (
            <a href={whatsappLink} target="_blank" rel="noreferrer">
              <Button size="lg" variant="outline" className="gap-2"><MessageCircle className="w-4 h-4" /> WhatsApp Us</Button>
            </a>
          )}
          {org.phone && (
            <a href={`tel:${org.phone}`}>
              <Button size="lg" variant="outline" className="gap-2"><Phone className="w-4 h-4" /> Call</Button>
            </a>
          )}
        </div>

        {/* About */}
        {branding?.about && (
          <section>
            <h2 className="text-xl font-bold mb-3">About</h2>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{branding.about}</p>
          </section>
        )}

        {/* Plans */}
        {plans.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">Membership Plans</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(p => (
                <Card key={p.id} className={`p-5 relative ${p.is_featured ? 'border-2 shadow-lg' : ''}`}
                  style={p.is_featured ? { borderColor: brandColor } : undefined}>
                  {p.is_featured && (
                    <Badge className="absolute -top-2 left-4 gap-1" style={{ backgroundColor: brandColor }}>
                      <Star className="w-3 h-3" /> Most Popular
                    </Badge>
                  )}
                  <h3 className="font-bold text-lg">{p.title}</h3>
                  {p.description && <p className="text-xs text-muted-foreground mt-1">{p.description}</p>}
                  <div className="my-4">
                    <span className="text-3xl font-extrabold">₹{Number(p.price).toLocaleString('en-IN')}</span>
                    <span className="text-sm text-muted-foreground ml-1">{p.duration_label}</span>
                  </div>
                  <ul className="space-y-2 mb-5">
                    {(p.features || []).map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: brandColor }} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to={`/join-gym?code=${gymCode}`} className="block">
                    <Button className="w-full" variant={p.is_featured ? 'default' : 'outline'}
                      style={p.is_featured ? { backgroundColor: brandColor } : undefined}>
                      Choose Plan
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Amenities */}
        {branding?.amenities?.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-3">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {branding.amenities.map((a: string, i: number) => (
                <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm">{a}</Badge>
              ))}
            </div>
          </section>
        )}

        {/* Gallery */}
        {branding?.gallery_urls?.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-3">Gallery</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {branding.gallery_urls.map((url: string, i: number) => (
                <a key={i} href={url} target="_blank" rel="noreferrer" className="aspect-square">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-lg hover:scale-[1.02] transition-transform" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Contact */}
        <section className="border-t pt-8">
          <h2 className="text-xl font-bold mb-4">Visit Us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {org.address && (
              <a href={branding?.google_maps_url || `https://maps.google.com/?q=${encodeURIComponent(org.address)}`} target="_blank" rel="noreferrer"
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/40 transition-colors">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">{org.address}</div>
              </a>
            )}
            {org.phone && (
              <a href={`tel:${org.phone}`} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/40 transition-colors">
                <Phone className="w-5 h-5 text-primary" />
                <div className="text-sm">{org.phone}</div>
              </a>
            )}
            {branding?.instagram_handle && (
              <a href={`https://instagram.com/${branding.instagram_handle.replace('@', '')}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/40 transition-colors">
                <Instagram className="w-5 h-5 text-primary" />
                <div className="text-sm">{branding.instagram_handle}</div>
              </a>
            )}
            {branding?.facebook_url && (
              <a href={branding.facebook_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/40 transition-colors">
                <Facebook className="w-5 h-5 text-primary" />
                <div className="text-sm">Facebook page</div>
              </a>
            )}
          </div>
        </section>

        <footer className="text-center text-xs text-muted-foreground pt-4 pb-8">
          Powered by <Link to="/" className="font-semibold hover:underline">FitAI Coach</Link>
        </footer>
      </main>
    </div>
  );
}
