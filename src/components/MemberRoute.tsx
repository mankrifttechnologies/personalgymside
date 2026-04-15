import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';

/**
 * Wraps member-only routes. If the user is an owner, redirect to /admin.
 */
export default function MemberRoute({ children }: { children: React.ReactNode }) {
  const { data: role, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (role === 'owner') {
    return <Navigate to="/owner" replace />;
  }

  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (role === 'trainer') {
    return <Navigate to="/trainer" replace />;
  }

  return <>{children}</>;
}
