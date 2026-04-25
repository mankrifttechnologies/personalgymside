import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// Root paths where back button should minimize the app (top-level tabs / dashboards)
const ROOT_PATHS = ['/', '/explorer', '/workout', '/messages', '/profile', '/auth', '/owner', '/admin', '/trainer'];

// Explicit parent mappings for sub-pages
const PARENT_MAP: Record<string, string> = {
  // Member sub-pages
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
  '/membership': '/profile',
  '/install': '/profile',
  '/classes': '/',
  '/duels': '/',
  '/mobility': '/workout',
  '/pt-sessions': '/',
  '/market': '/explorer',
  // Public / onboarding
  '/demo': '/',
  '/register-owner': '/auth',
  '/register-org': '/auth',
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

      // For dynamic routes
      if (path.startsWith('/member/')) {
        navigate('/explorer');
        return;
      }
      if (path.startsWith('/follow/')) {
        navigate('/profile');
        return;
      }
      if (path.startsWith('/g/')) {
        // public gym landing → close app or go home
        App.minimizeApp();
        return;
      }

      // Fallback: navigate back in history; if no history, go home
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/');
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [navigate, location.pathname]);

  return null;
}
