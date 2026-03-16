import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border px-1 sm:px-4 py-1.5 sm:py-2 z-50 safe-area-bottom">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {/* First two nav items */}
        {NAV_ITEMS.slice(0, 2).map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex flex-col items-center transition-colors min-w-[44px] sm:min-w-[48px] py-1 relative ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[10px] sm:text-xs mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        {/* Center Workout Button */}
        <div className="flex flex-col items-center min-w-[44px] sm:min-w-[48px]">
          <Link to="/workout" className="relative -top-2.5 sm:-top-3">
            <Button 
              variant="energy" 
              size="icon" 
              className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full shadow-lg transition-all ${
                isWorkoutActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105' : ''
              }`}
            >
              <Plus className="w-5 h-5 sm:w-7 sm:h-7" />
            </Button>
          </Link>
          <span className={`text-[10px] sm:text-xs -mt-1.5 sm:-mt-2 ${
            isWorkoutActive ? 'text-primary font-medium' : 'text-muted-foreground'
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
              className={`flex flex-col items-center transition-colors min-w-[44px] sm:min-w-[48px] py-1 relative ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                {showBadge && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
