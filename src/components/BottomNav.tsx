import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Activity, Compass, Utensils, User, Plus } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: Activity, label: 'Home' },
  { path: '/explorer', icon: Compass, label: 'Explore' },
  { path: '/nutrition', icon: Utensils, label: 'Food' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const isWorkoutActive = location.pathname === '/workout';
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border px-2 sm:px-4 py-2 sm:py-3 z-50 safe-area-bottom">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {/* First two nav items */}
        {NAV_ITEMS.slice(0, 2).map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex flex-col items-center transition-colors min-w-[48px] py-1 ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">{item.label}</span>
            </Link>
          );
        })}

        {/* Center Workout Button */}
        <div className="flex flex-col items-center">
          <Link to="/workout" className="relative -top-3 sm:-top-4">
            <Button 
              variant="energy" 
              size="icon" 
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg ${
                isWorkoutActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
              }`}
            >
              <Plus className="w-6 h-6 sm:w-7 sm:h-7" />
            </Button>
          </Link>
          <span className={`text-[10px] sm:text-xs -mt-2 sm:-mt-1 ${
            isWorkoutActive ? 'text-primary font-medium' : 'text-muted-foreground'
          }`}>Workout</span>
        </div>

        {/* Last two nav items */}
        {NAV_ITEMS.slice(2).map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex flex-col items-center transition-colors min-w-[48px] py-1 ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
