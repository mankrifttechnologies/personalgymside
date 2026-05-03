import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ChevronLeft, Building2 } from 'lucide-react';
import { useIsPendingVerification } from '@/hooks/useMemberVerification';

interface Props {
  /** Short feature name shown in the gate, e.g. "attendance check-in". */
  featureName: string;
}

/**
 * Full-screen lock used to gate gym-restricted features (attendance, classes,
 * PT bookings, paid services) for self-registered members who are still
 * waiting for owner approval.
 */
export default function PendingVerificationGate({ featureName }: Props) {
  const { organizationName } = useIsPendingVerification();

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 safe-area-top safe-area-bottom">
      <Card className="w-full max-w-md animate-slide-up">
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-warning/15 flex items-center justify-center">
            <Clock className="w-8 h-8 text-warning" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Awaiting gym verification</h2>
            <p className="text-sm text-muted-foreground">
              Your account is active, but{' '}
              <span className="font-semibold text-foreground">{featureName}</span> will unlock once{' '}
              {organizationName ? (
                <>
                  <span className="font-semibold text-foreground">{organizationName}</span> verifies
                  you
                </>
              ) : (
                'your gym verifies you'
              )}
              .
            </p>
          </div>

          <div className="rounded-xl bg-muted/40 border border-border p-3 flex items-start gap-3 text-left">
            <Building2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Tip: walk up to the front desk and ask them to approve your account in the gym owner
              dashboard. Approval is usually instant.
            </p>
          </div>

          <Link to="/" className="block">
            <Button variant="outline" className="w-full gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back to home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
