import { Bell, BellOff, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationBanner() {
  const { permission, isSupported, requestPermission } = useNotifications();
  const [dismissed, setDismissed] = useState(() => 
    sessionStorage.getItem('notificationBannerDismissed') === 'true'
  );

  if (!isSupported || permission === 'granted' || dismissed) {
    return null;
  }

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (!granted && permission === 'denied') {
      setDismissed(true);
      sessionStorage.setItem('notificationBannerDismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('notificationBannerDismissed', 'true');
  };

  return (
    <div className="glass rounded-xl p-4 animate-slide-up border-l-4 border-accent">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-accent/20">
          <Bell className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">Enable Workout Reminders</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Get notified when it's time for your scheduled workout
          </p>
          <div className="flex gap-2 mt-3">
            <Button variant="energy" size="sm" onClick={handleEnable}>
              Enable Notifications
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              Not Now
            </Button>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {permission === 'denied' && (
        <div className="mt-3 p-2 rounded-lg bg-destructive/10 flex items-center gap-2">
          <BellOff className="w-4 h-4 text-destructive" />
          <p className="text-xs text-destructive">
            Notifications blocked. Enable in browser settings.
          </p>
        </div>
      )}
    </div>
  );
}
