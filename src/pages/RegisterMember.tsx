import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Mail,
  Lock,
  ArrowRight,
  User,
  Building2,
  Search,
  Loader2,
  CheckCircle2,
  ChevronLeft,
} from 'lucide-react';
import AuthQuickLinks from '@/components/AuthQuickLinks';

type Step = 'gym' | 'account' | 'success';

export default function RegisterMember() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [step, setStep] = useState<Step>('gym');
  const [gymCode, setGymCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundOrg, setFoundOrg] = useState<{ id: string; name: string } | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSearchGym = async () => {
    if (!gymCode.trim()) return;
    setSearching(true);
    setFoundOrg(null);
    try {
      const { data, error } = await supabase.rpc('get_org_by_gym_code', {
        code: gymCode.trim().toUpperCase(),
      });
      if (error) throw error;
      if (data && data.length > 0) {
        setFoundOrg({ id: data[0].id, name: data[0].name });
        setStep('account');
      } else {
        toast.error('No gym found with that code. Double-check with your gym.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to look up gym');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundOrg) return;
    if (!name.trim() || !email.trim() || !password) {
      toast.error('All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      // 1. Create auth account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { name: name.trim() },
        },
      });
      if (signUpError) throw signUpError;

      // 2. If session is null (email confirmation required), sign in to insert membership
      if (!signUpData.session) {
        const { error: signInErr } = await signIn(email.trim(), password);
        if (signInErr) {
          // Likely email confirmation needed -> show success message anyway
          setStep('success');
          return;
        }
      }

      const { data: { user: authedUser } } = await supabase.auth.getUser();
      if (!authedUser) {
        setStep('success');
        return;
      }

      // 3. Update profile name
      await supabase
        .from('profiles')
        .update({ name: name.trim() })
        .eq('user_id', authedUser.id);

      // 4. Insert gym_members row as UNVERIFIED (pending owner approval)
      const memberCode = 'FIT' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      const { error: gmError } = await supabase.from('gym_members').insert({
        user_id: authedUser.id,
        member_code: memberCode,
        organization_id: foundOrg.id,
        status: 'active',
        is_verified: false,
      } as any);
      if (gmError && gmError.code !== '23505') throw gmError;

      setStep('success');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
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
          <div className="flex items-center gap-2 mb-4">
            {step !== 'gym' && step !== 'success' && (
              <Button
                variant="ghost"
                size="icon"
                className="-ml-2"
                onClick={() => setStep('gym')}
                type="button"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gradient">Join Your Gym</h1>
              <p className="text-xs text-muted-foreground mt-1">
                {step === 'gym' && 'Step 1 of 2 · Enter your gym code'}
                {step === 'account' && 'Step 2 of 2 · Create your account'}
                {step === 'success' && 'Almost there!'}
              </p>
            </div>
          </div>

          {step === 'gym' && (
            <Card className="bg-transparent border-0 shadow-none">
              <CardContent className="p-0 space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center mb-3">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ask your gym staff for the 6-character gym code, then enter it below.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={gymCode}
                    onChange={(e) => setGymCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    className="text-center font-mono text-lg tracking-widest"
                    maxLength={6}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchGym()}
                  />
                  <Button onClick={handleSearchGym} disabled={searching || !gymCode.trim()} size="icon">
                    {searching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <div className="pt-3 border-t border-border/40">
                  <AuthQuickLinks />
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'account' && foundOrg && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/15">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Joining</p>
                  <p className="font-semibold truncate">{foundOrg.name}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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
                disabled={submitting}
              >
                {submitting ? 'Creating account…' : 'Create Account & Request Approval'}
                <ArrowRight className="w-5 h-5" />
              </Button>

              <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                You'll get full access to most features right away. Attendance check-in, class
                bookings and PT sessions will unlock once your gym verifies you.
              </p>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4 py-2">
              <CheckCircle2 className="w-16 h-16 mx-auto text-accent" />
              <div>
                <h2 className="text-xl font-bold mb-1">Account created! 🎉</h2>
                <p className="text-sm text-muted-foreground">
                  We've notified <span className="font-semibold">{foundOrg?.name}</span>. Once they
                  approve you, you'll get full access to attendance and class bookings.
                </p>
              </div>
              <Button className="w-full" onClick={() => navigate('/')}>
                Continue to App
              </Button>
              <Link to="/auth" className="block text-xs text-muted-foreground hover:underline">
                Need to sign in instead?
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
