import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useMemberSearch } from '@/hooks/useMemberSearch';
import { useFollows } from '@/hooks/useFollows';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BottomNav from '@/components/BottomNav';
import { MemberSearchCard } from '@/components/MemberSearchCard';
import { Search, Lock, ImageIcon, Camera, Loader2, Users, Grid3X3 } from 'lucide-react';

export default function Explorer() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const { followersCount, followingCount } = useFollows();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: results = [], isLoading: isSearching } = useMemberSearch(searchQuery);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-glow p-4 rounded-full bg-primary/20">
          <Search className="w-8 h-8 text-primary animate-float" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isApproved = profile?.is_approved || false;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="p-4">
        <h1 className="text-xl font-bold">Explore</h1>
        <p className="text-sm text-muted-foreground">Discover members & content</p>
      </header>

      <main className="px-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search members by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Search Results */}
        {searchQuery.length >= 2 && (
          <div className="space-y-3">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : results.length > 0 ? (
              results.map((member) => (
                <MemberSearchCard key={member.user_id} member={member} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No members found
              </div>
            )}
          </div>
        )}

        {/* Content Tabs */}
        {searchQuery.length < 2 && (
          <Tabs defaultValue="feed" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="feed" className="gap-2">
                <Grid3X3 className="w-4 h-4" />
                Feed
              </TabsTrigger>
              <TabsTrigger value="photos" className="gap-2">
                <ImageIcon className="w-4 h-4" />
                My Photos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="mt-4">
              {isApproved ? (
                <FeedContent />
              ) : (
                <div className="glass rounded-xl p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                    <Lock className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg">Feed Locked</h3>
                  <p className="text-muted-foreground text-sm">
                    Your account needs admin approval to view the community feed. 
                    Until then, you can view and upload your own photos.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-primary">
                    <Users className="w-4 h-4" />
                    <span>{followersCount} followers · {followingCount} following</span>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="photos" className="mt-4">
              <MyPhotosContent />
            </TabsContent>
          </Tabs>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function FeedContent() {
  // This would show photos from users the current user follows
  // For now, showing a placeholder
  return (
    <div className="space-y-4">
      <div className="text-center py-8 text-muted-foreground">
        <Grid3X3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Follow members to see their photos here</p>
        <Link to="/leaderboard">
          <Button variant="outline" size="sm" className="mt-3">
            Find Members
          </Button>
        </Link>
      </div>
    </div>
  );
}

function MyPhotosContent() {
  // User's own photo gallery
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">My Photos</h3>
        <Button variant="outline" size="sm" className="gap-2">
          <Camera className="w-4 h-4" />
          Upload
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-1">
        {/* Placeholder for no photos */}
        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center col-span-3">
          <div className="text-center py-8">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No photos yet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
