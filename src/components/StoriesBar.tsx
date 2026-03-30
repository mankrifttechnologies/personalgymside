import { useState, useRef } from 'react';
import { useStories } from '@/hooks/useStories';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Camera, Plus, X, Eye, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface StoryViewerProps {
  stories: any[];
  onClose: () => void;
  onViewed: (storyId: string) => void;
  isOwnStory?: boolean;
  onDelete?: (storyId: string) => void;
}

function StoryViewer({ stories, onClose, onViewed, isOwnStory, onDelete }: StoryViewerProps) {
  const [index, setIndex] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const story = stories[index];

  const { data: viewers } = useQuery({
    queryKey: ['story-viewers', story?.id],
    queryFn: async () => {
      if (!story?.id) return [];
      const { data: views, error } = await supabase
        .from('story_views')
        .select('viewer_id, viewed_at')
        .eq('story_id', story.id);
      if (error) throw error;

      if (!views?.length) return [];
      const viewerIds = views.map(v => v.viewer_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', viewerIds);

      return views.map(v => ({
        ...v,
        profile: profiles?.find(p => p.user_id === v.viewer_id),
      }));
    },
    enabled: !!story?.id && isOwnStory,
  });

  if (!story) return null;

  const goNext = () => {
    if (!isOwnStory) onViewed(story.id);
    if (index < stories.length - 1) setIndex(index + 1);
    else onClose();
  };

  const goPrev = () => {
    if (index > 0) setIndex(index - 1);
  };

  const viewCount = viewers?.length || 0;

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-sm p-0 bg-background border-none overflow-hidden h-[80vh]">
          <div className="relative h-full flex flex-col">
            {/* Progress bars */}
            <div className="flex gap-1 p-2 absolute top-0 left-0 right-0 z-10">
              {stories.map((_, i) => (
                <div key={i} className="flex-1 h-1 rounded-full bg-foreground/20">
                  <div className={`h-full rounded-full bg-foreground transition-all ${i <= index ? 'w-full' : 'w-0'}`} />
                </div>
              ))}
            </div>

            {/* Top actions */}
            <div className="absolute top-8 right-2 z-10 flex items-center gap-1">
              {isOwnStory && onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:text-destructive"
                  onClick={() => { onDelete(story.id); if (stories.length <= 1) onClose(); else goNext(); }}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="text-foreground" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Image */}
            <div className="flex-1 relative">
              <img src={story.image_url} alt="Story" className="w-full h-full object-cover" />
              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/80 to-transparent">
                {story.caption && <p className="text-foreground font-medium mb-1">{story.caption}</p>}
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}
                </p>
                {/* View count for own stories */}
                {isOwnStory && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowViewers(true); }}
                    className="flex items-center gap-1.5 mt-2 text-sm text-foreground/80 hover:text-foreground transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="font-medium">{viewCount}</span>
                    <span className="text-xs text-muted-foreground">viewer{viewCount !== 1 ? 's' : ''}</span>
                  </button>
                )}
              </div>
              {/* Nav areas */}
              <div className="absolute inset-0 flex">
                <div className="w-1/3 cursor-pointer" onClick={goPrev} />
                <div className="w-1/3" />
                <div className="w-1/3 cursor-pointer" onClick={goNext} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Viewers Sheet */}
      <Sheet open={showViewers} onOpenChange={setShowViewers}>
        <SheetContent side="bottom" className="h-[50vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Viewed by {viewCount}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2 overflow-y-auto">
            {viewers?.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No views yet</p>
            )}
            {viewers?.map((v) => (
              <div key={v.viewer_id} className="flex items-center gap-3 p-2 rounded-lg">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={v.profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {(v.profile?.name || '??').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{v.profile?.name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(v.viewed_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default function StoriesBar() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { stories, storiesByUser, createStory, markViewed, deleteStory } = useStories();
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const myStories = user ? storiesByUser[user.id] || [] : [];
  const hasMyStories = myStories.length > 0;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/stories/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('photos').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path);
      await createStory.mutateAsync({ imageUrl: urlData.publicUrl, caption });
      setCaption('');
      setShowUpload(false);
    } catch {
      toast.error('Failed to upload story');
    } finally {
      setUploading(false);
    }
  };

  const userIds = Object.keys(storiesByUser);

  return (
    <>
      <div className="glass rounded-xl p-3">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Stories</h3>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {/* My story */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <button
              onClick={() => {
                if (hasMyStories) {
                  setViewingUser(user!.id);
                } else if (showUpload) {
                  fileRef.current?.click();
                } else {
                  setShowUpload(true);
                }
              }}
              className={`w-14 h-14 rounded-full relative flex items-center justify-center ${
                hasMyStories
                  ? 'bg-gradient-to-tr from-primary to-accent p-0.5'
                  : 'border-2 border-dashed border-primary bg-primary/10'
              }`}
            >
              {hasMyStories ? (
                <Avatar className="w-full h-full border-2 border-background">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary text-xs">
                    {(profile?.name || 'ME').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : showUpload ? (
                <Camera className="w-6 h-6 text-primary" />
              ) : (
                <Plus className="w-6 h-6 text-primary" />
              )}
              {/* Add button overlay when has stories */}
              {hasMyStories && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowUpload(true); }}
                  className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold border-2 border-background"
                >
                  +
                </button>
              )}
            </button>
            <span className="text-[10px] text-muted-foreground">
              {hasMyStories ? `${myStories.length} story` : 'Your Story'}
            </span>
          </div>

          {/* Other users' stories */}
          {userIds.filter(uid => uid !== user?.id).map(uid => {
            const userStories = storiesByUser[uid];
            return (
              <button
                key={uid}
                onClick={() => setViewingUser(uid)}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-accent p-0.5">
                  <Avatar className="w-full h-full border-2 border-background">
                    <AvatarFallback className="bg-secondary text-xs">
                      {uid.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-[10px] text-muted-foreground">{userStories.length} new</span>
              </button>
            );
          })}
        </div>

        {showUpload && (
          <div className="mt-3 flex gap-2">
            <Input
              placeholder="Add a caption..."
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="flex-1"
            />
            <Button variant="energy" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? '...' : '📸'}
            </Button>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {/* Story Viewer */}
      {viewingUser && storiesByUser[viewingUser] && (
        <StoryViewer
          stories={storiesByUser[viewingUser]}
          onClose={() => setViewingUser(null)}
          onViewed={(id) => markViewed.mutate(id)}
          isOwnStory={viewingUser === user?.id}
          onDelete={(id) => deleteStory.mutate(id)}
        />
      )}
    </>
  );
}
