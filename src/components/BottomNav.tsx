import { Link, useLocation } from 'react-router-dom';
import { Activity, Compass, MessageCircle, User, Plus } from 'lucide-react';
import { useUnreadMessages } from '@/hooks/useMessages';

const NAV_ITEMS = [
  { path: '/', icon: Activity, label: 'Home' },
  { path: '/explorer', icon: Compass, label: 'Explore' },
  { path: '/messages', icon: MessageCircle, label: 'Chat' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const isWorkoutActive = currentPath === '/workout';
  const { unreadCount } = useUnreadMessages();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Floating pill container */}
      <div className="mx-3 mb-2 sm:mx-4 sm:mb-3">
        <div className="glass-nav rounded-2xl px-2 py-2 max-w-lg mx-auto">
          <div className="flex justify-around items-center">
            {/* First two nav items */}
            {NAV_ITEMS.slice(0, 2).map((item) => {
              const isActive = currentPath === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground active:scale-95'
                  }`}
                >
                  <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-[10px] mt-0.5 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* Center Workout FAB */}
            <div className="flex flex-col items-center -mt-7">
              <Link to="/workout">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90 ${
                    isWorkoutActive
                      ? 'gradient-primary glow-button scale-105'
                      : 'gradient-primary'
                  }`}
                  style={{ boxShadow: '0 4px 20px hsl(24 100% 55% / 0.4)' }}
                >
                  <Plus className="w-7 h-7 text-primary-foreground" strokeWidth={2.5} />
                </div>
              </Link>
              <span className={`text-[10px] mt-1 font-medium ${
                isWorkoutActive ? 'text-primary' : 'text-muted-foreground'
              }`}>Workout</span>
            </div>

            {/* Last two nav items */}
            {NAV_ITEMS.slice(2).map((item) => {
              const isActive = currentPath === item.path;
              const Icon = item.icon;
              const showBadge = item.path === '/messages' && unreadCount > 0;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground active:scale-95'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                    {showBadge && (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] mt-0.5 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
