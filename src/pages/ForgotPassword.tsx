import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Mail, ArrowRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import appLogo from '@/assets/app-logo.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message ?? 'Failed to send reset email', variant: 'destructive' });
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
            <h1 className="text-2xl font-bold text-gradient">Reset Password</h1>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-14 h-14 mx-auto text-accent" />
              <div>
                <h2 className="text-lg font-bold mb-1">Check your inbox</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a reset link to <span className="font-semibold">{email}</span>. The link
                  expires in 1 hour.
                </p>
              </div>
              <Link to="/auth">
                <Button variant="outline" className="w-full">
                  <ChevronLeft className="w-4 h-4" /> Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" variant="energy" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Link'}
                <ArrowRight className="w-5 h-5" />
              </Button>

              <Link to="/auth" className="block text-center text-sm text-muted-foreground hover:underline">
                Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
