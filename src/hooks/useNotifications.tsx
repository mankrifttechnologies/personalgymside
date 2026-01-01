import { useState, useEffect, useCallback } from 'react';
import { useReminders } from './useReminders';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const { reminder, shouldShowReminder } = useReminders();

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return null;
    
    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  const sendWorkoutReminder = useCallback(() => {
    if (!reminder) return;
    
    sendNotification('FitAI Coach - Workout Time! 💪', {
      body: reminder.reminder_message || "Time to hit the gym! Your scheduled workout is waiting.",
      tag: 'workout-reminder',
      requireInteraction: true,
    });
  }, [reminder, sendNotification]);

  // Check for reminders periodically
  useEffect(() => {
    if (permission !== 'granted' || !reminder?.is_enabled) return;

    const checkReminder = () => {
      if (shouldShowReminder()) {
        // Check if we already notified in this window
        const lastNotified = sessionStorage.getItem('lastWorkoutReminder');
        const today = new Date().toDateString();
        
        if (lastNotified !== today) {
          sendWorkoutReminder();
          sessionStorage.setItem('lastWorkoutReminder', today);
        }
      }
    };

    // Check immediately
    checkReminder();

    // Check every minute
    const interval = setInterval(checkReminder, 60000);
    
    return () => clearInterval(interval);
  }, [permission, reminder, shouldShowReminder, sendWorkoutReminder]);

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
    sendWorkoutReminder,
  };
}
