import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useReminders } from '@/hooks/useReminders';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, ChevronLeft, Clock, Save,
  Activity, Dumbbell, Utensils, User, Plus, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export default function Reminders() {
  const { user, loading: authLoading } = useAuth();
  const { reminder, isLoading, upsertReminder } = useReminders();
  const { permission, requestPermission, isSupported } = useNotifications();
  
  const [isEnabled, setIsEnabled] = useState(reminder?.is_enabled ?? true);
  const [reminderTime, setReminderTime] = useState(reminder?.reminder_time?.slice(0, 5) ?? '09:00');
  const [selectedDays, setSelectedDays] = useState<number[]>(reminder?.days_of_week ?? [1, 2, 3, 4, 5]);
  const [message, setMessage] = useState(reminder?.reminder_message ?? 'Time to hit the gym! 💪');

  // Update local state when reminder loads
  if (reminder && !isLoading) {
    if (isEnabled !== reminder.is_enabled) setIsEnabled(reminder.is_enabled);
    if (reminderTime !== reminder.reminder_time?.slice(0, 5)) setReminderTime(reminder.reminder_time?.slice(0, 5) || '09:00');
    if (JSON.stringify(selectedDays) !== JSON.stringify(reminder.days_of_week)) setSelectedDays(reminder.days_of_week);
    if (message !== reminder.reminder_message) setMessage(reminder.reminder_message || '');
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-glow p-4 rounded-full bg-primary/20">
          <Bell className="w-8 h-8 text-primary animate-float" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const handleEnableToggle = async (enabled: boolean) => {
    setIsEnabled(enabled);
    
    // Request notification permission when enabling reminders
    if (enabled && isSupported && permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        toast.warning('Enable notifications in your browser settings to receive workout reminders');
      }
    }
  };

  const handleSave = async () => {
    try {
      await upsertReminder.mutateAsync({
        is_enabled: isEnabled,
        reminder_time: reminderTime + ':00',
        days_of_week: selectedDays,
        reminder_message: message,
      });
      toast.success('Reminder settings saved!');
    } catch (error) {
      toast.error('Failed to save reminder settings');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="p-4 flex items-center gap-3">
        <Link to="/profile">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Workout Reminders</h1>
          <p className="text-sm text-muted-foreground">Stay on track</p>
        </div>
      </header>

      <main className="px-4 space-y-6">
        {/* Enable/Disable */}
        <div className="glass rounded-xl p-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Workout Reminders</p>
                <p className="text-sm text-muted-foreground">
                  {isEnabled ? 'Reminders are active' : 'Reminders are disabled'}
                </p>
              </div>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={handleEnableToggle}
            />
          </div>
        </div>

        {/* Reminder Time */}
        <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            Reminder Time
          </h3>
          <Input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="text-center text-xl font-bold"
          />
        </div>

        {/* Days of Week */}
        <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-semibold mb-4">Remind Me On</h3>
          <div className="flex justify-between">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  selectedDays.includes(day.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Message */}
        <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="font-semibold mb-4">Reminder Message</h3>
          <Input
            placeholder="Your motivational message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground mt-2">{message.length}/100 characters</p>
        </div>

        {/* Notification Info */}
        <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="font-semibold mb-2">How It Works</h3>
          <p className="text-sm text-muted-foreground">
            When you open the app during your scheduled reminder time, you'll see a notification 
            reminding you to work out. Make sure to keep the app installed for reminders to work!
          </p>
        </div>

        {/* Save Button */}
        <Button 
          variant="energy" 
          className="w-full"
          onClick={handleSave}
          disabled={upsertReminder.isPending}
        >
          {upsertReminder.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Settings
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}
