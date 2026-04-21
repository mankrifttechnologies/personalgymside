import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MarketplaceListing, MARKET_CATEGORIES, CONDITIONS } from '@/hooks/useMarketplace';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, MapPin, Truck, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  listing: MarketplaceListing | null;
  onClose: () => void;
}

export default function ListingDetailSheet({ listing, onClose }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activePhoto, setActivePhoto] = useState(0);

  if (!listing) return null;

  const categoryLabel = MARKET_CATEGORIES.find((c) => c.value === listing.category)?.label || listing.category;
  const conditionLabel = CONDITIONS.find((c) => c.value === listing.condition)?.label || listing.condition;
  const isOwn = user?.id === listing.seller_id;

  const handleContact = () => {
    onClose();
    navigate(`/messages?to=${listing.seller_id}&context=${encodeURIComponent(`Hi! Is "${listing.title}" still available?`)}`);
  };

  return (
    <Dialog open={!!listing} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-[calc(100vw-1.5rem)] max-h-[92dvh] overflow-y-auto p-0 gap-0">
        <VisuallyHidden>
          <DialogTitle>{listing.title}</DialogTitle>
          <DialogDescription>Product details</DialogDescription>
        </VisuallyHidden>
        {/* Photo carousel */}
        <div className="relative aspect-square bg-muted">
          {listing.photos[activePhoto] && (
            <img src={listing.photos[activePhoto]} alt={listing.title} className="w-full h-full object-cover" />
          )}
          {listing.photos.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {listing.photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`w-1.5 h-1.5 rounded-full transition ${i === activePhoto ? 'bg-white w-4' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-bold leading-tight">{listing.title}</h2>
            </div>
            <p className="text-2xl font-bold text-primary mt-1">
              ₹{listing.price.toLocaleString()}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{categoryLabel}</Badge>
            <Badge variant="outline">{conditionLabel}</Badge>
            {listing.brand && <Badge variant="outline">{listing.brand}</Badge>}
          </div>

          {listing.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
          )}

          <div className="space-y-1.5 text-xs text-muted-foreground">
            {listing.location && (
              <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {listing.location}</div>
            )}
            <div className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> {listing.delivery_option === 'both' ? 'Pickup or shipping' : listing.delivery_option === 'shipping' ? 'Shipping available' : 'Pickup only'}</div>
            <div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> {listing.stock} in stock</div>
          </div>

          {/* Seller info */}
          <button
            onClick={() => { onClose(); navigate(`/member/${listing.seller_id}`); }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 active:scale-[0.98] transition"
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={listing.seller_avatar} className="object-cover" />
              <AvatarFallback>{listing.seller_name?.[0]?.toUpperCase() || 'M'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">{listing.seller_name}</p>
              {listing.organization_name && (
                <p className="text-xs text-muted-foreground truncate">{listing.organization_name}</p>
              )}
            </div>
          </button>

          {!isOwn && (
            <Button className="w-full" size="lg" onClick={handleContact}>
              <MessageCircle className="w-4 h-4 mr-2" /> Message seller
            </Button>
          )}
          {isOwn && (
            <p className="text-center text-xs text-muted-foreground">This is your listing</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
