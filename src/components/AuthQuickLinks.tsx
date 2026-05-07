import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Building2, LogIn } from 'lucide-react';

interface AuthQuickLinksProps {
  /** Hide the link that points to the current screen. */
  hide?: Array<'signin' | 'member' | 'owner'>;
  className?: string;
}

/**
 * Compact set of links shown across every auth-related screen so users can
 * always jump to:
 *  - Sign In (/auth)
 *  - Sign Up With Gym Code (/register)
 *  - Register Your Gym (/register-owner)
 */
export default function AuthQuickLinks({ hide = [], className = '' }: AuthQuickLinksProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const autoHide = new Set<string>(hide);
  if (pathname === '/auth') autoHide.add('signin');
  if (pathname.startsWith('/register-owner')) autoHide.add('owner');
  if (pathname === '/register' || pathname === '/join-gym') autoHide.add('member');

  return (
    <div className={`grid grid-cols-1 gap-2 ${className}`}>
      {!autoHide.has('member') && (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => navigate('/register')}
        >
          <ArrowRight className="w-4 h-4 text-primary" />
          Sign Up With Gym Code
        </Button>
      )}
      {!autoHide.has('owner') && (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => navigate('/register-owner')}
        >
          <Building2 className="w-4 h-4 text-primary" />
          Register Your Gym
        </Button>
      )}
      {!autoHide.has('signin') && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => navigate('/auth')}
        >
          <LogIn className="w-4 h-4 text-muted-foreground" />
          Already have an account? Sign In
        </Button>
      )}
    </div>
  );
}
