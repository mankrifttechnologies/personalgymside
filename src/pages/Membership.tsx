import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import {
  CreditCard, Crown, Check, Loader2, ChevronLeft,
  Zap, Shield, Star, ExternalLink
} from 'lucide-react';

// TODO: Replace these with your actual Stripe price IDs after creating products
const PLANS = [
  {
    name: 'Basic',
    price: '₹499/mo',
    priceId: 'price_basic_monthly', // Replace with actual
    features: ['Gym access', 'Basic workout tracking', 'Community feed'],
    icon: Zap,
    color: 'from-secondary to-muted',
  },
  {
    name: 'Pro',
    price: '₹999/mo',
    priceId: 'price_pro_monthly', // Replace with actual
    features: ['Everything in Basic', 'AI Coach', 'Smart Workout Builder', 'Progress reports', 'Priority support'],
    icon: Star,
    popular: true,
    color: 'from-primary to-energy-glow',
  },
  {
    name: 'Elite',
    price: '₹1,999/mo',
    priceId: 'price_elite_monthly', // Replace with actual
    features: ['Everything in Pro', 'Personal trainer access', '1-on-1 video calls', 'Custom meal plans', 'VIP badge'],
    icon: Crown,
    color: 'from-warning to-accent',
  },
];

export default function Membership() {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [managingPortal, setManagingPortal] = useState(false);

  useEffect(() => {
    if (user) checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscription(data);
    } catch (e) {
      console.error('Subscription check error:', e);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const handleSubscribe = async (priceId: string) => {
    setLoadingPlan(priceId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to start checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to open portal');
    } finally {
      setManagingPortal(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Check for success/cancel params
  const params = new URLSearchParams(window.location.search);
  if (params.get('success') === 'true') {
    toast.success('Subscription activated! Welcome aboard! 🎉');
    window.history.replaceState({}, '', '/membership');
  }

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
          <p className="text-sm text-muted-foreground">Choose your fitness journey</p>
        </div>
        {subscription?.subscribed && (
          <Button
            variant="glass"
            size="sm"
            onClick={handleManageSubscription}
            disabled={managingPortal}
            className="gap-1"
          >
            {managingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Manage
          </Button>
        )}
      </header>

      <main className="px-4 space-y-4">
        {/* Current subscription banner */}
        {subscription?.subscribed && (
          <div className="glass rounded-xl p-4 border-l-4 border-accent animate-slide-up">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              <span className="font-semibold text-accent">Active Subscription</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Renews {subscription.subscription_end
                ? new Date(subscription.subscription_end).toLocaleDateString()
                : 'soon'}
            </p>
          </div>
        )}

        {checkingSubscription ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = subscription?.subscribed && subscription?.product_id;

              return (
                <div
                  key={plan.priceId}
                  className={`glass rounded-xl p-5 relative overflow-hidden animate-slide-up ${
                    plan.popular ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
                      Most Popular
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${plan.color}`}>
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                      <p className="text-xl font-bold text-primary">{plan.price}</p>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-accent flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.popular ? 'energy' : 'secondary'}
                    className="w-full gap-2"
                    onClick={() => handleSubscribe(plan.priceId)}
                    disabled={!!loadingPlan || subscription?.subscribed}
                  >
                    {loadingPlan === plan.priceId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    {subscription?.subscribed ? 'Current Plan' : 'Subscribe'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full"
          onClick={checkSubscription}
        >
          Refresh subscription status
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}
