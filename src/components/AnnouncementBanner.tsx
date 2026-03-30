import { useAnnouncements } from '@/hooks/useAnnouncements';
import { Megaphone, X } from 'lucide-react';
import { useState } from 'react';

export default function AnnouncementBanner() {
  const { data: announcements } = useAnnouncements();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = announcements?.filter(a => !dismissed.has(a.id) && (a.priority === 'high' || a.priority === 'urgent')) || [];
  
  if (visible.length === 0) return null;

  const latest = visible[0];
  const isUrgent = latest.priority === 'urgent';

  return (
    <div className={`mx-4 mb-3 p-3 rounded-xl flex items-start gap-2.5 ${
      isUrgent ? 'bg-destructive/15 border border-destructive/30' : 'bg-primary/10 border border-primary/20'
    }`}>
      <Megaphone className={`w-4 h-4 mt-0.5 shrink-0 ${isUrgent ? 'text-destructive' : 'text-primary'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold">{latest.title}</p>
        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{latest.message}</p>
      </div>
      <button onClick={() => setDismissed(prev => new Set([...prev, latest.id]))} className="shrink-0">
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}
