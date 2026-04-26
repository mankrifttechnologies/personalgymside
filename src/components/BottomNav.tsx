import { Link, useLocation } from 'react-router-dom';
import { 
  Activity, Compass, MessageCircle, User, Plus, Store,
  Building2, Users, BarChart3, Settings,
  Dumbbell, Calendar, ClipboardList
} from 'lucide-react';
import { useUnreadMessages } from '@/hooks/useMessages';
import { useUserRole } from '@/hooks/useUserRole';

type NavItem = {
  path: string;
  icon: React.ElementType;
  label: string;
};

const MEMBER_ITEMS: NavItem[] = [
  { path: '/', icon: Activity, label: 'Home' },
  { path: '/explorer', icon: Compass, label: 'Explore' },
  { path: '/market', icon: Store, label: 'Market' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const OWNER_ITEMS: NavItem[] = [
  { path: '/owner', icon: Building2, label: 'Dashboard' },
  { path: '/owner?tab=users', icon: Users, label: 'Members' },
  { path: '/owner?tab=stats', icon: BarChart3, label: 'Analytics' },
  { path: '/owner?tab=settings', icon: Settings, label: 'Settings' },
];

const TRAINER_ITEMS: NavItem[] = [
  { path: '/trainer', icon: Dumbbell, label: 'Clients' },
  { path: '/trainer?tab=schedule', icon: Calendar, label: 'Schedule' },
  { path: '/trainer?tab=sessions', icon: ClipboardList, label: 'Sessions' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const ADMIN_ITEMS: NavItem[] = [
  { path: '/admin', icon: Building2, label: 'Admin' },
  { path: '/owner', icon: BarChart3, label: 'Manage' },
  { path: '/messages', icon: MessageCircle, label: 'Chat' },
  { path: '/profile', icon: User, label: 'Profile' },
];

// Maps deep/child routes to the top-level tab that should appear active.
// Keys are tested with `startsWith` so dynamic segments are covered.
const DEEP_ROUTE_TAB: Record<string, string> = {
  // Member tabs
  '/nutrition': '/',
  '/progress': '/',
  '/history': '/',
  '/schedule': '/',
  '/classes': '/',
  '/duels': '/',
  '/pt-sessions': '/',
  '/membership': '/profile',
  '/measurements': '/profile',
  '/reminders': '/profile',
  '/friends': '/profile',
  '/attendance': '/profile',
  '/leaderboard': '/profile',
  '/rewards': '/profile',
  '/support': '/profile',
  '/install': '/profile',
  '/follow/': '/profile',
  '/member/': '/explorer',
  '/records': '/workout',
  '/templates': '/workout',
  '/mobility': '/workout',
  '/market': '/market',
  '/g/': '/explorer', // public gym landing falls back to Explore tab
};

function resolveActivePath(currentPath: string): string {
  // Direct match wins
  if (['/', '/explorer', '/workout', '/profile', '/market', '/messages',
       '/owner', '/trainer', '/admin'].includes(currentPath)) {
    return currentPath;
  }
  // Deep-route prefix match (longest first for specificity)
  const keys = Object.keys(DEEP_ROUTE_TAB).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (currentPath === key || currentPath.startsWith(key)) {
      return DEEP_ROUTE_TAB[key];
    }
  }
  return currentPath;
}

function isItemActive(itemPath: string, currentPath: string, currentSearch: string) {
  // For items with query params (like /owner?tab=users)
  if (itemPath.includes('?')) {
    const [basePath, query] = itemPath.split('?');
    if (currentPath !== basePath) return false;
    const params = new URLSearchParams(query);
    const currentParams = new URLSearchParams(currentSearch);
    for (const [key, value] of params.entries()) {
      if (currentParams.get(key) !== value) return false;
    }
    return true;
  }
  // Resolve deep routes to their parent tab for active state
  const activePath = resolveActivePath(currentPath);
  return activePath === itemPath;
}

// Routes where the bottom nav must NOT be shown
const HIDDEN_ROUTES = ['/auth', '/demo', '/qr-checkin', '/install',
                       '/register-owner', '/register-org', '/join-gym'];

function shouldHideNav(path: string) {
  if (HIDDEN_ROUTES.includes(path)) return true;
  if (path.startsWith('/g/')) return true; // public gym landing
  return false;
}

export default function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const currentSearch = location.search;
  const { unreadCount } = useUnreadMessages();
  const { data: role } = useUserRole();

  const isMember = !role || role === 'member';
  const isOwner = role === 'owner';
  const isTrainer = role === 'trainer';
  const isAdmin = role === 'admin';

  const navItems = isOwner
    ? OWNER_ITEMS
    : isTrainer
    ? TRAINER_ITEMS
    : isAdmin
    ? ADMIN_ITEMS
    : MEMBER_ITEMS;

  const showWorkoutFab = isMember;
  const workoutActive = resolveActivePath(currentPath) === '/workout';

  if (shouldHideNav(currentPath)) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pointer-events-none"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 0px)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 0px)',
      }}
    >
      <div className="mx-3 mb-2 sm:mx-4 sm:mb-3 pointer-events-auto">
        <div className="glass-nav rounded-2xl px-2 py-2 max-w-lg mx-auto">
          <div className="flex justify-around items-center">
            {showWorkoutFab ? (
              <>
                {/* Member layout: 2 items, FAB, 2 items */}
                {navItems.slice(0, 2).map((item) => {
                  const isActive = isItemActive(item.path, currentPath, currentSearch);
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
                        workoutActive
                          ? 'gradient-primary glow-button scale-105'
                          : 'gradient-primary'
                      }`}
                      style={{ boxShadow: '0 4px 20px hsl(24 100% 55% / 0.4)' }}
                    >
                      <Plus className="w-7 h-7 text-primary-foreground" strokeWidth={2.5} />
                    </div>
                  </Link>
                  <span className={`text-[10px] mt-1 font-medium ${
                    workoutActive ? 'text-primary' : 'text-muted-foreground'
                  }`}>Workout</span>
                </div>

                {navItems.slice(2).map((item) => {
                  const isActive = isItemActive(item.path, currentPath, currentSearch);
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
              </>
            ) : (
              /* Owner / Trainer / Admin: even 4-tab layout */
              navItems.map((item) => {
                const isActive = isItemActive(item.path, currentPath, currentSearch);
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
              })
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
