import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Mail, Lock, ArrowRight, Info, Building2 } from 'lucide-react';
import appLogo from '@/assets/app-logo.png';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    const pendingOwner = localStorage.getItem('pending_owner_registration');
    if (pendingOwner) {
      localStorage.removeItem('pending_owner_registration');
      return <Navigate to="/register-org" replace />;
    }
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        navigate('/');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
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
        <div className="glass rounded-2xl p-8 animate-slide-up">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center gap-3">
              <img src={appLogo} alt="FitAI Coach" className="w-14 h-14 object-contain" />
              <h1 className="text-4xl font-bold text-gradient">FitAI Coach</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-2">developed by Mankrift Technologies</p>
          </div>

          <h2 className="text-xl font-semibold text-center mb-6">
            Welcome Back
          </h2>

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

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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

            <Button 
              type="submit" 
              variant="energy" 
              size="lg" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Need an account?</p>
                  <p>Accounts are created by administrators only. Contact your gym admin or staff to get access.</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">Own a gym?</p>
                  <p className="text-muted-foreground mb-2">Register your gym on our platform and manage your members.</p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/register-owner')} className="gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    Register Your Gym
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
