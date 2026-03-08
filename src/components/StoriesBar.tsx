import { useState, useRef } from 'react';
import { useStories } from '@/hooks/useStories';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Camera, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface StoryViewerProps {
  stories: any[];
  onClose: () => void;
  onViewed: (storyId: string) => void;
}

function StoryViewer({ stories, onClose, onViewed }: StoryViewerProps) {
  const [index, setIndex] = useState(0);
  const story = stories[index];
  
  if (!story) return null;

  const goNext = () => {
    onViewed(story.id);
    if (index < stories.length - 1) setIndex(index + 1);
    else onClose();
  };

  const goPrev = () => {
    if (index > 0) setIndex(index - 1);
  };

  const progress = ((index + 1) / stories.length) * 100;

  return (
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

          {/* Close */}
          <Button variant="ghost" size="icon" className="absolute top-8 right-2 z-10 text-foreground" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>

          {/* Image */}
          <div className="flex-1 relative">
            <img
              src={story.image_url}
              alt="Story"
              className="w-full h-full object-cover"
            />
            {/* Caption */}
            {story.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/80 to-transparent">
                <p className="text-foreground font-medium">{story.caption}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}
                </p>
              </div>
            )}
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
  );
}

export default function StoriesBar() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { stories, storiesByUser, createStory, markViewed } = useStories();
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
          {/* Add story */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <button
              onClick={() => {
                if (showUpload) {
                  fileRef.current?.click();
                } else {
                  setShowUpload(true);
                }
              }}
              className="w-14 h-14 rounded-full border-2 border-dashed border-primary flex items-center justify-center bg-primary/10"
            >
              {showUpload ? <Camera className="w-6 h-6 text-primary" /> : <Plus className="w-6 h-6 text-primary" />}
            </button>
            <span className="text-[10px] text-muted-foreground">Your Story</span>
          </div>

          {/* User stories */}
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

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Story Viewer */}
      {viewingUser && storiesByUser[viewingUser] && (
        <StoryViewer
          stories={storiesByUser[viewingUser]}
          onClose={() => setViewingUser(null)}
          onViewed={(id) => markViewed.mutate(id)}
        />
      )}
    </>
  );
}
