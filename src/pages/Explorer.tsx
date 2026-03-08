import { useState } from 'react';
import StoriesBar from '@/components/StoriesBar';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useMemberSearch } from '@/hooks/useMemberSearch';
import { useFollows } from '@/hooks/useFollows';
import { usePhotos } from '@/hooks/usePhotos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BottomNav from '@/components/BottomNav';
import { MemberSearchCard } from '@/components/MemberSearchCard';
import { PhotoCard } from '@/components/feed/PhotoCard';
import { PhotoUpload } from '@/components/feed/PhotoUpload';
import { FollowSuggestions } from '@/components/FollowSuggestions';
import { Search, Lock, ImageIcon, Loader2, Users, Grid3X3, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
    <div className="min-h-screen pb-24 safe-area-top">
      {/* Header */}
      <header className="p-3 sm:p-4">
        <h1 className="text-lg sm:text-xl font-bold">Explore</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Discover members & content</p>
      </header>

      <main className="px-3 sm:px-4 space-y-4 sm:space-y-5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search members by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-sm"
          />
          {searchQuery && (
            <p className="text-[10px] text-muted-foreground mt-1">
              {searchQuery.length < 2 ? 'Type at least 2 characters to search' : `Searching for "${searchQuery}"`}
            </p>
          )}
        </div>

        {/* Search Results */}
        {searchQuery.length >= 2 && (
          <div className="space-y-2 sm:space-y-3">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : results.length > 0 ? (
              <>
                <p className="text-xs text-muted-foreground">{results.length} members found</p>
                {results.map((member) => (
                  <MemberSearchCard key={member.user_id} member={member} />
                ))}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No members found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}

        {/* Content Tabs */}
        {searchQuery.length < 2 && (
          <>
            {/* Follow Suggestions */}
            <FollowSuggestions />
            
            <Tabs defaultValue="feed" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="feed" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Grid3X3 className="w-3 h-3 sm:w-4 sm:h-4" />
                  Feed
                </TabsTrigger>
                <TabsTrigger value="photos" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                  <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  My Photos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="feed" className="mt-4">
                {isApproved ? (
                  <FeedContent />
                ) : (
                  <div className="glass rounded-xl p-6 sm:p-8 text-center space-y-3 sm:space-y-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                      <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg">Feed Locked</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      Your account needs admin approval to view the community feed. 
                      Until then, you can view and upload your own photos.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-primary">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{followersCount} followers · {followingCount} following</span>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="photos" className="mt-4">
                <MyPhotosContent />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function FeedContent() {
  const { feedPhotos, feedLoading, deletePhoto } = usePhotos();
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);

  if (feedLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (feedPhotos.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-muted-foreground">
          <Grid3X3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Follow members to see their photos here</p>
          <p className="text-sm mt-1">Or upload your first photo!</p>
          <div className="mt-4 flex justify-center gap-2">
            <Link to="/leaderboard">
              <Button variant="outline" size="sm">
                Find Members
              </Button>
            </Link>
            <PhotoUpload />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {feedPhotos.map((photo) => (
          <PhotoCard 
            key={photo.id} 
            photo={photo} 
            onDelete={() => setPhotoToDelete(photo.id)}
          />
        ))}
      </div>

      <AlertDialog open={!!photoToDelete} onOpenChange={() => setPhotoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (photoToDelete) {
                  deletePhoto.mutate(photoToDelete);
                  setPhotoToDelete(null);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MyPhotosContent() {
  const { myPhotos, myPhotosLoading, deletePhoto } = usePhotos();
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">My Photos</h3>
          <PhotoUpload />
        </div>
        
        {myPhotosLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : myPhotos.length === 0 ? (
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center py-8">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No photos yet</p>
              <p className="text-xs text-muted-foreground mt-1">Upload your first photo to get started!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {myPhotos.map((photo) => (
              <div 
                key={photo.id} 
                className="aspect-square relative group cursor-pointer"
                onClick={() => setPhotoToDelete(photo.id)}
              >
                <img
                  src={photo.photo_url}
                  alt={photo.caption || 'Photo'}
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <div className="flex items-center gap-3 text-white text-sm">
                    <span>❤️ {photo.likes_count}</span>
                    <span>💬 {photo.comments_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!photoToDelete} onOpenChange={() => setPhotoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (photoToDelete) {
                  deletePhoto.mutate(photoToDelete);
                  setPhotoToDelete(null);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
