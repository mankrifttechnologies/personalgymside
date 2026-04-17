import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Store, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  useMarketplaceListings,
  useMyListings,
  useMyOrganizationId,
  useDeleteListing,
  MARKET_CATEGORIES,
  MarketplaceListing,
} from '@/hooks/useMarketplace';
import { useAuth } from '@/hooks/useAuth';
import CreateListingDialog from '@/components/marketplace/CreateListingDialog';
import ListingDetailSheet from '@/components/marketplace/ListingDetailSheet';
import { Skeleton } from '@/components/ui/skeleton';

export default function Market() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: myOrgId } = useMyOrganizationId();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [scope, setScope] = useState<'all' | 'my_gym'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<MarketplaceListing | null>(null);

  const { data: listings = [], isLoading } = useMarketplaceListings({
    category,
    scope,
    search,
    myGymOrgId: myOrgId,
  });
  const { data: myListings = [] } = useMyListings();
  const deleteListing = useDeleteListing();

  return (
    <div className="min-h-[100dvh] bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 active:scale-95">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">Market</h1>
          </div>
          {user && (
            <Button size="sm" onClick={() => setCreateOpen(true)} className="h-8 px-3">
              <Plus className="w-4 h-4 mr-1" /> Sell
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-9 h-10 rounded-full bg-muted border-0"
            />
          </div>
        </div>

        {/* Scope toggle */}
        <div className="px-4 pb-2 flex gap-2">
          <button
            onClick={() => setScope('all')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition ${scope === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            All gyms
          </button>
          <button
            onClick={() => setScope('my_gym')}
            disabled={!myOrgId}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition ${scope === 'my_gym' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} ${!myOrgId ? 'opacity-50' : ''}`}
          >
            My gym
          </button>
        </div>

        {/* Category chips */}
        <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 w-max">
            <CategoryChip active={category === 'all'} onClick={() => setCategory('all')} label="All" />
            {MARKET_CATEGORIES.map((c) => (
              <CategoryChip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)} label={c.label} />
            ))}
          </div>
        </div>
      </header>

      <Tabs defaultValue="browse" className="px-4 pt-3">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="mine">My listings ({myListings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
            </div>
          ) : listings.length === 0 ? (
            <EmptyState onSell={() => setCreateOpen(true)} />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} onClick={() => setSelected(l)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine" className="mt-4">
          {myListings.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">You haven't listed anything yet</p>
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Create listing
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {myListings.map((l) => (
                <div key={l.id} className="flex items-center gap-3 p-2 rounded-xl bg-card border border-border">
                  <button onClick={() => setSelected(l as MarketplaceListing)} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {l.photos[0] && <img src={l.photos[0]} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold truncate">{l.title}</p>
                      <p className="text-xs text-primary font-bold">₹{l.price.toLocaleString()}</p>
                      <Badge variant="outline" className="mt-0.5 text-[10px] h-4 px-1">{l.status}</Badge>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this listing?')) deleteListing.mutate(l.id);
                    }}
                    className="p-2 text-destructive active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateListingDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ListingDetailSheet listing={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function CategoryChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      }`}
    >
      {label}
    </button>
  );
}

function ListingCard({ listing, onClick }: { listing: MarketplaceListing; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left active:scale-[0.98] transition">
      <div className="aspect-square rounded-xl bg-muted overflow-hidden">
        {listing.photos[0] && (
          <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" loading="lazy" />
        )}
      </div>
      <div className="mt-1.5 px-0.5">
        <p className="text-sm font-bold text-foreground">₹{listing.price.toLocaleString()}</p>
        <p className="text-xs text-foreground/80 line-clamp-1">{listing.title}</p>
        <p className="text-[10px] text-muted-foreground line-clamp-1">{listing.seller_name}</p>
      </div>
    </button>
  );
}

function EmptyState({ onSell }: { onSell: () => void }) {
  return (
    <div className="text-center py-16">
      <Store className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
      <h3 className="font-bold text-base">No listings yet</h3>
      <p className="text-sm text-muted-foreground mt-1">Be the first to sell something!</p>
      <Button className="mt-4" onClick={onSell}>
        <Plus className="w-4 h-4 mr-1" /> Create listing
      </Button>
    </div>
  );
}
