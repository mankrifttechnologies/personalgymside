import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import appLogo from '@/assets/app-logo.png';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // When user clicks the reset link, Supabase auto-creates a recovery session.
    supabase.auth.getSession().then(({ data }) => {
      setValidSession(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setValidSession(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Password too short', description: 'Use at least 6 characters', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message ?? 'Failed to update password', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 safe-area-top safe-area-bottom">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="glass rounded-2xl p-6 sm:p-8 animate-slide-up">
          <div className="flex flex-col items-center mb-6">
            <img src={appLogo} alt="FitAI Coach" className="w-12 h-12 object-contain mb-2" />
            <h1 className="text-2xl font-bold text-gradient">Set New Password</h1>
          </div>

          {done ? (
            <div className="text-center space-y-3 py-4">
              <CheckCircle2 className="w-14 h-14 mx-auto text-accent" />
              <p className="font-semibold">Password updated!</p>
              <p className="text-sm text-muted-foreground">Redirecting…</p>
            </div>
          ) : validSession === false ? (
            <div className="text-center space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                This reset link is invalid or has expired. Request a new one.
              </p>
              <Button className="w-full" onClick={() => navigate('/forgot-password')}>
                Request New Link
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button type="submit" variant="energy" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Updating…' : 'Update Password'}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
