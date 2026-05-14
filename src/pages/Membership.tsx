import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGymMember } from '@/hooks/useAttendance';
import { useMembershipPlans } from '@/hooks/useRevenue';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import {
  Crown, Check, Loader2, ChevronLeft,
  Shield, IndianRupee, Sparkles,
} from 'lucide-react';
import { format, addDays } from 'date-fns';

export default function Membership() {
  const { user, loading: authLoading } = useAuth();
  const { data: gymMember } = useGymMember();
  const { data: plans, isLoading: plansLoading } = useMembershipPlans();
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [latestPayment, setLatestPayment] = useState<any | null>(null);
  const [loadingLatest, setLoadingLatest] = useState(true);

  // Fetch the user's latest payment record so we can show their active plan / pending request
  useEffect(() => {
    if (!gymMember?.id) {
      setLoadingLatest(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('payment_records')
        .select('id, amount, status, payment_date, plan_id, membership_plans(name, duration_days)')
        .eq('member_id', gymMember.id)
        .order('payment_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      setLatestPayment(data);
      setLoadingLatest(false);
    })();
  }, [gymMember?.id, submittingId]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const handleActivate = async (planId: string, price: number) => {
    if (!gymMember?.id) {
      toast.error('You need to join a gym before activating a plan.');
      return;
    }
    setSubmittingId(planId);
    try {
      const { error } = await supabase.from('payment_records').insert({
        member_id: gymMember.id,
        plan_id: planId,
        amount: price,
        payment_method: 'pending',
        status: 'pending',
        notes: 'Activation requested by member',
        created_by: user.id,
      });
      if (error) throw error;
      toast.success('Activation request sent to your gym owner!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to request activation');
    } finally {
      setSubmittingId(null);
    }
  };

  const activePlan =
    latestPayment?.status === 'paid'
      ? latestPayment
      : null;
  const pendingPlan =
    latestPayment?.status === 'pending' ? latestPayment : null;

  return (
    <div className="min-h-screen pb-24 safe-area-top">
      <header className="p-4 flex items-center gap-3">
        <Link to="/profile">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Membership Plans</h1>
          <p className="text-sm text-muted-foreground">Choose your plan & request activation</p>
        </div>
      </header>

      <main className="px-4 space-y-4">
        {/* Active / Pending banner */}
        {!loadingLatest && activePlan && (
          <div className="glass rounded-xl p-4 border-l-4 border-accent animate-slide-up">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              <span className="font-semibold text-accent">Active Plan</span>
            </div>
            <p className="text-sm mt-1">
              {(activePlan as any).membership_plans?.name || 'Membership'}
            </p>
            {(activePlan as any).membership_plans?.duration_days && (
              <p className="text-xs text-muted-foreground">
                Valid till {format(
                  addDays(new Date(activePlan.payment_date), (activePlan as any).membership_plans.duration_days),
                  'dd MMM yyyy'
                )}
              </p>
            )}
          </div>
        )}

        {!loadingLatest && pendingPlan && (
          <div className="glass rounded-xl p-4 border-l-4 border-warning animate-slide-up">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-warning animate-spin" />
              <span className="font-semibold text-warning">Awaiting confirmation</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Your gym owner will confirm your payment shortly.
            </p>
          </div>
        )}

        {plansLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !plans || plans.filter(p => p.is_active).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Crown className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No plans available yet</p>
              <p className="text-sm mt-1">Your gym hasn't published membership plans.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {plans.filter(p => p.is_active).map(plan => {
              const isPending = pendingPlan?.plan_id === plan.id;
              const isActive = activePlan?.plan_id === plan.id;
              return (
                <div
                  key={plan.id}
                  className="glass rounded-xl p-5 relative overflow-hidden animate-slide-up"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-energy-glow shrink-0">
                        <Sparkles className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base truncate">{plan.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">
                          {plan.plan_type} · {plan.duration_days} days
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center text-xl font-bold text-primary shrink-0">
                      <IndianRupee className="w-4 h-4" />
                      {plan.price}
                    </div>
                  </div>

                  {plan.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {plan.description}
                    </p>
                  )}

                  {plan.features.length > 0 && (
                    <ul className="space-y-1.5 mb-4">
                      {plan.features.slice(0, 5).map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-accent flex-shrink-0" />
                          <span className="truncate">{feature as string}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button
                    variant={isActive ? 'secondary' : 'energy'}
                    className="w-full gap-2"
                    onClick={() => handleActivate(plan.id, plan.price)}
                    disabled={!!submittingId || isActive || isPending}
                  >
                    {submittingId === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isActive ? (
                      <Check className="w-4 h-4" />
                    ) : null}
                    {isActive ? 'Active Plan' : isPending ? 'Pending approval' : 'Activate Plan'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground text-center px-4">
          Tap "Activate Plan" to send a request to your gym owner. Pay them in person — they'll confirm the payment in the app.
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
