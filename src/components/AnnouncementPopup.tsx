import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUnreadAnnouncements, useMarkAnnouncementRead } from '@/hooks/useAnnouncementPopup';
import { Megaphone, ChevronLeft, ChevronRight, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function AnnouncementPopup() {
  const { data: unread = [] } = useUnreadAnnouncements();
  const markRead = useMarkAnnouncementRead();
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (unread.length > 0) {
      setOpen(true);
      setCurrentIndex(0);
    }
  }, [unread.length]);

  if (unread.length === 0) return null;

  const current = unread[currentIndex];
  if (!current) return null;

  const isUrgent = current.priority === 'urgent';
  const isHigh = current.priority === 'high';

  const handleMarkRead = () => {
    markRead.mutate(current.id);
    if (currentIndex < unread.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setOpen(false);
    }
  };

  const handleMarkAllRead = () => {
    unread.forEach(a => markRead.mutate(a.id));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isUrgent ? 'bg-destructive/15' : isHigh ? 'bg-primary/15' : 'bg-muted'
            }`}>
              <Megaphone className={`w-5 h-5 ${
                isUrgent ? 'text-destructive' : 'text-primary'
              }`} />
            </div>
            Announcement
            {unread.length > 1 && (
              <Badge variant="secondary" className="text-[10px] ml-auto">
                {currentIndex + 1} / {unread.length}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            New announcement from your gym
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {(isUrgent || isHigh) && (
                <Badge variant={isUrgent ? 'destructive' : 'default'} className="text-[10px]">
                  {current.priority}
                </Badge>
              )}
              <span className="text-[11px] text-muted-foreground">
                {format(new Date(current.created_at), 'MMM d, yyyy · h:mm a')}
              </span>
            </div>
            <h3 className="text-base font-bold">{current.title}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{current.message}</p>
          </div>

          <div className="flex items-center gap-2">
            {unread.length > 1 && currentIndex > 0 && (
              <Button size="sm" variant="outline" onClick={() => setCurrentIndex(prev => prev - 1)} className="h-9">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}

            <Button size="sm" className="flex-1 h-9" onClick={handleMarkRead} disabled={markRead.isPending}>
              <CheckCheck className="w-4 h-4 mr-1.5" />
              Mark as Read
            </Button>

            {unread.length > 1 && currentIndex < unread.length - 1 && (
              <Button size="sm" variant="outline" onClick={() => setCurrentIndex(prev => prev + 1)} className="h-9">
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {unread.length > 1 && (
            <Button size="sm" variant="ghost" className="w-full text-xs h-8" onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
