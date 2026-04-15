import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// Root paths where back button should minimize the app
const ROOT_PATHS = ['/', '/explorer', '/workout', '/messages', '/profile', '/auth', '/owner', '/admin', '/trainer'];

// Explicit parent mappings for sub-pages
const PARENT_MAP: Record<string, string> = {
  '/nutrition': '/',
  '/progress': '/',
  '/measurements': '/profile',
  '/records': '/workout',
  '/templates': '/workout',
  '/reminders': '/profile',
  '/schedule': '/',
  '/friends': '/profile',
  '/history': '/',
  '/attendance': '/profile',
  '/leaderboard': '/profile',
  '/rewards': '/profile',
  '/support': '/profile',
  '/membership': '/',
  '/install': '/',
  '/classes': '/',
  '/duels': '/',
  '/mobility': '/',
  '/pt-sessions': '/',
  '/demo': '/',
  '/register-owner': '/auth',
  '/register-org': '/',
  '/join-gym': '/',
  '/qr-checkin': '/owner',
};

export default function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener('backButton', () => {
      const path = location.pathname;

      // On root paths, minimize the app
      if (ROOT_PATHS.includes(path)) {
        App.minimizeApp();
        return;
      }

      // Check explicit parent mapping
      const parent = PARENT_MAP[path];
      if (parent) {
        navigate(parent);
        return;
      }

      // For dynamic routes like /member/:id or /follow/:id/:tab, go to parent
      if (path.startsWith('/member/')) {
        navigate('/explorer');
        return;
      }
      if (path.startsWith('/follow/')) {
        navigate('/profile');
        return;
      }

      // Fallback: navigate back in history, or go home
      navigate(-1);
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [navigate, location.pathname]);

  return null;
}
