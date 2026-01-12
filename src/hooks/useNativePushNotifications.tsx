import { useEffect, useState } from 'react';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export const useNativePushNotifications = () => {
  const [token, setToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<PushNotificationSchema[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNative = Capacitor.isNativePlatform();

  const registerNotifications = async () => {
    if (!isNative) {
      setError('Push notifications are only available on native devices');
      return false;
    }

    try {
      // Request permission
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        setError('Push notification permission denied');
        return false;
      }

      // Register for push notifications
      await PushNotifications.register();
      setIsRegistered(true);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register for push notifications';
      setError(errorMessage);
      return false;
    }
  };

  useEffect(() => {
    if (!isNative) return;

    // On registration success
    const registrationListener = PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token:', token.value);
      setToken(token.value);
    });

    // On registration error
    const registrationErrorListener = PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
      setError(error.error);
    });

    // On notification received while app is in foreground
    const notificationListener = PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      setNotifications(prev => [...prev, notification]);
    });

    // On notification action performed (user tapped notification)
    const actionListener = PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push notification action performed:', action);
    });

    return () => {
      registrationListener.then(listener => listener.remove());
      registrationErrorListener.then(listener => listener.remove());
      notificationListener.then(listener => listener.remove());
      actionListener.then(listener => listener.remove());
    };
  }, [isNative]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    token,
    notifications,
    isRegistered,
    error,
    isNative,
    registerNotifications,
    clearNotifications
  };
};
