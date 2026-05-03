import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsPendingVerification } from '@/hooks/useMemberVerification';
import PendingVerificationGate from '@/components/PendingVerificationGate';
import { Loader2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Short label for the gate, e.g. "attendance check-in". */
  featureName: string;
}

/**
 * Like <MemberRoute> but additionally blocks self-registered members who
 * haven't been verified by their gym yet. Use for attendance, classes,
 * PT bookings and paid services.
 */
export default function VerifiedMemberRoute({ children, featureName }: Props) {
  const { data: role, isLoading: roleLoading } = useUserRole();
  const { isPending, isLoading: verLoading } = useIsPendingVerification();

  if (roleLoading || verLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (role === 'owner') return <Navigate to="/owner" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'trainer') return <Navigate to="/trainer" replace />;

  if (isPending) {
    return <PendingVerificationGate featureName={featureName} />;
  }

  return <>{children}</>;
}
