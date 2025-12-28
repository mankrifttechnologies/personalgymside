import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Activity, Dumbbell, Utensils, User, Plus, TrendingUp } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: Activity, label: 'Home' },
  { path: '/workout', icon: Dumbbell, label: 'Workout' },
  { path: '/progress', icon: TrendingUp, label: 'Progress' },
  { path: '/nutrition', icon: Utensils, label: 'Food' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border px-4 py-3 z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {NAV_ITEMS.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          // Center button (Plus button)
          if (index === 2) {
            return (
              <div key={item.path} className="flex flex-col items-center">
                <Link to="/workout" className="relative -top-4">
                  <Button variant="energy" size="icon" className="w-14 h-14 rounded-full shadow-lg">
                    <Plus className="w-7 h-7" />
                  </Button>
                </Link>
              </div>
            );
          }
          
          return (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex flex-col items-center transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
