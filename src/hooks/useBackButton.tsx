import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const ROOT_PATHS = ['/', '/explorer', '/workout', '/messages', '/profile'];

export function useBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener('backButton', ({ canGoBack }) => {
      // If on a root/tab page, minimize app instead of closing
      if (ROOT_PATHS.includes(location.pathname)) {
        App.minimizeApp();
      } else if (canGoBack) {
        navigate(-1);
      } else {
        App.minimizeApp();
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [navigate, location.pathname]);
}
