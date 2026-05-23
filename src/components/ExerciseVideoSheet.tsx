import { useEffect, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ExternalLink, Youtube, RotateCcw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getExerciseVideoId, getYouTubeSearchUrl } from '@/lib/exerciseVideos';

// Lazy-load the YouTube IFrame API once
let ytApiPromise: Promise<any> | null = null;
function loadYouTubeAPI(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject();
  if ((window as any).YT && (window as any).YT.Player) {
    return Promise.resolve((window as any).YT);
  }
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    (window as any).onYouTubeIframeAPIReady = () => resolve((window as any).YT);
  });
  return ytApiPromise;
}

interface Props {
  exerciseName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExerciseVideoSheet({ exerciseName, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const saveIntervalRef = useRef<number | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [resumedAt, setResumedAt] = useState<number>(0);

  const storageKey = (vid: string) => `exvid:${user?.id || 'anon'}:${vid}`;

  // Resolve video id when sheet opens
  useEffect(() => {
    if (!open || !exerciseName) {
      setVideoId(null);
      return;
    }
    const vid = getExerciseVideoId(exerciseName);
    setVideoId(vid);
  }, [open, exerciseName]);

  // Initialize YT player when videoId is set & sheet is open
  useEffect(() => {
    if (!open || !videoId || !containerRef.current) return;

    let cancelled = false;
    const savedTime = parseFloat(localStorage.getItem(storageKey(videoId)) || '0') || 0;
    setResumedAt(savedTime);

    loadYouTubeAPI().then((YT) => {
      if (cancelled || !containerRef.current) return;
      // Clean any prior player
      containerRef.current.innerHTML = '<div id="yt-player-mount"></div>';
      playerRef.current = new YT.Player('yt-player-mount', {
        videoId,
        playerVars: {
          start: Math.floor(savedTime),
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (e: any) => {
            if (savedTime > 1) {
              try { e.target.seekTo(savedTime, true); } catch {}
            }
          },
        },
      });

      // Save current time every 3s while open
      saveIntervalRef.current = window.setInterval(() => {
        try {
          const t = playerRef.current?.getCurrentTime?.();
          if (typeof t === 'number' && t > 0) {
            localStorage.setItem(storageKey(videoId), String(t));
          }
        } catch {}
      }, 3000);
    });

    return () => {
      cancelled = true;
      if (saveIntervalRef.current) {
        // Save once more on unmount
        try {
          const t = playerRef.current?.getCurrentTime?.();
          if (typeof t === 'number' && t > 0) {
            localStorage.setItem(storageKey(videoId), String(t));
          }
        } catch {}
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
      try { playerRef.current?.destroy?.(); } catch {}
      playerRef.current = null;
    };
  }, [open, videoId, user?.id]);

  const restart = () => {
    if (!videoId) return;
    localStorage.removeItem(storageKey(videoId));
    try { playerRef.current?.seekTo?.(0, true); } catch {}
    try { playerRef.current?.playVideo?.(); } catch {}
    setResumedAt(0);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl p-0 flex flex-col">
        <SheetHeader className="p-4 pb-2 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 text-left">
            <Youtube className="w-5 h-5 text-primary" />
            <span className="truncate">{exerciseName || 'Exercise Video'}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {videoId ? (
            <>
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
                <div ref={containerRef} className="absolute inset-0" />
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">
                  {resumedAt > 1
                    ? `Resuming at ${Math.floor(resumedAt / 60)}:${String(Math.floor(resumedAt % 60)).padStart(2, '0')}`
                    : 'Playback position is saved automatically'}
                </span>
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={restart}>
                  <RotateCcw className="w-3.5 h-3.5" /> Restart
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground/80 text-center pt-1">
                Video plays from YouTube. Position saved on this device.
              </p>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 gap-3">
              <Youtube className="w-12 h-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No embedded video for this exercise yet.</p>
              {exerciseName && (
                <a
                  href={getYouTubeSearchUrl(exerciseName)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="energy" className="gap-2">
                    <ExternalLink className="w-4 h-4" /> Search on YouTube
                  </Button>
                </a>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
