import { WifiOff, CloudUpload, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOfflineWorkouts } from '@/hooks/useOfflineWorkouts';

export default function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing, syncWorkouts } = useOfflineWorkouts();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
      !isOnline 
        ? 'bg-warning/20 text-warning' 
        : 'bg-accent/20 text-accent'
    }`}>
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4 shrink-0" />
          <span className="flex-1">Offline mode — workouts saved locally</span>
          {pendingCount > 0 && (
            <span className="text-xs font-bold bg-warning/30 px-2 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </>
      ) : pendingCount > 0 ? (
        <>
          <CloudUpload className="w-4 h-4 shrink-0" />
          <span className="flex-1">{pendingCount} exercise{pendingCount > 1 ? 's' : ''} to sync</span>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 px-2"
            onClick={syncWorkouts}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Check className="w-3 h-3" />
            )}
          </Button>
        </>
      ) : null}
    </div>
  );
}
