import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MARKET_CATEGORIES,
  CONDITIONS,
  DELIVERY_OPTIONS,
  uploadMarketplacePhoto,
  useCreateListing,
  useMyOrganizationId,
} from '@/hooks/useMarketplace';
import { useAuth } from '@/hooks/useAuth';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateListingDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { data: myOrgId } = useMyOrganizationId();
  const createListing = useCreateListing();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('supplements');
  const [condition, setCondition] = useState('new');
  const [brand, setBrand] = useState('');
  const [stock, setStock] = useState('1');
  const [location, setLocation] = useState('');
  const [delivery, setDelivery] = useState('pickup');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setTitle(''); setDescription(''); setPrice(''); setCategory('supplements');
    setCondition('new'); setBrand(''); setStock('1'); setLocation('');
    setDelivery('pickup'); setPhotos([]);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !user) return;
    if (photos.length + files.length > 5) {
      toast.error('Max 5 photos');
      return;
    }
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of files) {
        if (f.size > 5 * 1024 * 1024) {
          toast.error(`${f.name} is too large (max 5MB)`);
          continue;
        }
        const url = await uploadMarketplacePhoto(user.id, f);
        urls.push(url);
      }
      setPhotos([...photos, ...urls]);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error('Title is required');
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) return toast.error('Valid price required');
    if (photos.length === 0) return toast.error('Add at least one photo');

    await createListing.mutateAsync({
      title: title.trim(),
      description: description.trim(),
      price: priceNum,
      category,
      condition,
      brand: brand.trim(),
      stock: parseInt(stock) || 1,
      location: location.trim(),
      delivery_option: delivery,
      photos,
      organization_id: myOrgId || null,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>List an item</DialogTitle>
          <DialogDescription>Sell to your gym community</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photos */}
          <div>
            <Label>Photos ({photos.length}/5)</Label>
            <div className="mt-2 flex gap-2 flex-wrap">
              {photos.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground active:scale-95 transition"
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          </div>

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="e.g. Whey Protein 2kg" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price">Price *</Label>
              <Input id="price" type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" type="number" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MARKET_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="brand">Brand (optional)</Label>
            <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={50} />
          </div>

          <div>
            <Label htmlFor="loc">Pickup location (optional)</Label>
            <Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={100} />
          </div>

          <div>
            <Label>Delivery</Label>
            <Select value={delivery} onValueChange={setDelivery}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DELIVERY_OPTIONS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={3} placeholder="Details, condition notes, etc." />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={createListing.isPending || uploading}>
            {createListing.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Post listing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
