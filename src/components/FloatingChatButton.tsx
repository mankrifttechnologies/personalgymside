import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useUnreadMessages } from '@/hooks/useMessages';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';

/**
 * Floating chat launcher pinned to bottom-left for members.
 * Hidden on /messages, /auth and for non-member roles.
 */
export default function FloatingChatButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: role } = useUserRole();
  const { unreadCount } = useUnreadMessages();

  const isMember = !role || role === 'member';
  const hiddenRoutes = ['/messages', '/auth', '/workout'];
  const isHidden =
    !user ||
    !isMember ||
    hiddenRoutes.some((r) => location.pathname.startsWith(r));

  if (isHidden) return null;

  return (
    <button
      onClick={() => navigate('/messages')}
      aria-label="Open messages"
      className="fixed right-4 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 hover:bg-primary/90 transition-all"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}
    >
      <MessageCircle className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-background">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
