import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  Clock,
} from 'lucide-react';
import AuthQuickLinks from '@/components/AuthQuickLinks';

type Step = 'gym' | 'account' | 'success';
type GymSelection =
  | { kind: 'org'; id: string; name: string }
  | { kind: 'pending'; name: string };

export default function RegisterMember() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [step, setStep] = useState<Step>('gym');
  const [mode, setMode] = useState<'code' | 'name'>('code');

  // Code lookup
  const [gymCode, setGymCode] = useState('');
  const [searchingCode, setSearchingCode] = useState(false);

  // Name search
  const [nameQuery, setNameQuery] = useState('');
  const [searchingName, setSearchingName] = useState(false);
  const [results, setResults] = useState<Array<{ id: string; name: string; gym_code: string }>>([]);
  const [searched, setSearched] = useState(false);

  const [selection, setSelection] = useState<GymSelection | null>(null);

  // Account form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSearchCode = async () => {
    if (!gymCode.trim()) return;
    setSearchingCode(true);
    try {
      const { data, error } = await supabase.rpc('get_org_by_gym_code', {
        code: gymCode.trim().toUpperCase(),
      });
      if (error) throw error;
      if (data && data.length > 0) {
        setSelection({ kind: 'org', id: data[0].id, name: data[0].name });
        setStep('account');
      } else {
        toast.error('No gym found with that code. Try searching by name instead.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to look up gym');
    } finally {
      setSearchingCode(false);
    }
  };

  const handleSearchName = async () => {
    const q = nameQuery.trim();
    if (q.length < 2) {
      toast.error('Type at least 2 characters');
      return;
    }
    setSearchingName(true);
    setSearched(false);
    try {
      const { data, error } = await supabase.rpc('search_organizations_by_name', { query: q });
      if (error) throw error;
      setResults(data ?? []);
      setSearched(true);
    } catch (err: any) {
      toast.error(err.message || 'Search failed');
    } finally {
      setSearchingName(false);
    }
  };

  const pickOrg = (org: { id: string; name: string }) => {
    setSelection({ kind: 'org', id: org.id, name: org.name });
    setStep('account');
  };

  const usePendingGym = () => {
    const trimmed = nameQuery.trim();
    if (trimmed.length < 2) {
      toast.error('Please type your gym name');
      return;
    }
    setSelection({ kind: 'pending', name: trimmed });
    setStep('account');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selection) return;
    if (!name.trim() || !email.trim() || !password) {
      toast.error('All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { name: name.trim() },
        },
      });
      if (signUpError) throw signUpError;

      if (!signUpData.session) {
        const { error: signInErr } = await signIn(email.trim(), password);
        if (signInErr) {
          setStep('success');
          return;
        }
      }

      const { data: { user: authedUser } } = await supabase.auth.getUser();
      if (!authedUser) {
        setStep('success');
        return;
      }

      await supabase.from('profiles').update({ name: name.trim() }).eq('user_id', authedUser.id);

      const memberCode = 'FIT' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      const insertPayload: any = {
        user_id: authedUser.id,
        member_code: memberCode,
        status: 'active',
        is_verified: false,
      };
      if (selection.kind === 'org') {
        insertPayload.organization_id = selection.id;
      } else {
        insertPayload.pending_gym_name = selection.name;
      }

      const { error: gmError } = await supabase.from('gym_members').insert(insertPayload);
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
                {step === 'gym' && 'Step 1 of 2 · Find your gym'}
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
                </div>

                <Tabs value={mode} onValueChange={(v) => setMode(v as 'code' | 'name')}>
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="code">Have a code</TabsTrigger>
                    <TabsTrigger value="name">Search by name</TabsTrigger>
                  </TabsList>

                  <TabsContent value="code" className="space-y-3 mt-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Enter the 6-character gym code from your gym.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={gymCode}
                        onChange={(e) => setGymCode(e.target.value.toUpperCase())}
                        placeholder="ABC123"
                        className="text-center font-mono text-lg tracking-widest"
                        maxLength={6}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchCode()}
                      />
                      <Button
                        onClick={handleSearchCode}
                        disabled={searchingCode || !gymCode.trim()}
                        size="icon"
                      >
                        {searchingCode ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="name" className="space-y-3 mt-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Search for your gym. If it isn't here yet, you can still sign up — we'll link
                      you when your gym joins.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={nameQuery}
                        onChange={(e) => setNameQuery(e.target.value)}
                        placeholder="e.g. Gold's Gym Mumbai"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchName()}
                      />
                      <Button
                        onClick={handleSearchName}
                        disabled={searchingName || nameQuery.trim().length < 2}
                        size="icon"
                      >
                        {searchingName ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {results.length > 0 && (
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {results.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => pickOrg(r)}
                            className="w-full text-left p-3 rounded-lg border border-border/60 hover:border-primary/50 hover:bg-primary/5 transition flex items-center gap-3"
                          >
                            <div className="p-2 rounded-lg bg-primary/15 shrink-0">
                              <Building2 className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{r.name}</p>
                              <p className="text-[11px] text-muted-foreground font-mono">
                                {r.gym_code}
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {searched && (
                      <div className="rounded-lg border border-dashed border-border/60 p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-xs text-muted-foreground">
                            {results.length === 0
                              ? "Can't find your gym? "
                              : 'Not the right one? '}
                            Continue with the name you typed — you'll get full app access. When
                            your gym registers, an owner can verify you.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={usePendingGym}
                          disabled={nameQuery.trim().length < 2}
                        >
                          Continue with "{nameQuery.trim()}"
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="pt-3 border-t border-border/40">
                  <AuthQuickLinks />
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'account' && selection && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div
                className={`rounded-xl border p-3 flex items-center gap-3 ${
                  selection.kind === 'org'
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-amber-500/30 bg-amber-500/5'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    selection.kind === 'org' ? 'bg-primary/15' : 'bg-amber-500/15'
                  }`}
                >
                  {selection.kind === 'org' ? (
                    <Building2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    {selection.kind === 'org' ? 'Joining' : 'Pending verification'}
                  </p>
                  <p className="font-semibold truncate">{selection.name}</p>
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
                {submitting ? 'Creating account…' : 'Create Account'}
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
                  {selection?.kind === 'org' ? (
                    <>
                      We've notified <span className="font-semibold">{selection.name}</span>. Once
                      they approve you, you'll get full access to attendance and class bookings.
                    </>
                  ) : (
                    <>
                      You're in! When <span className="font-semibold">{selection?.name}</span>{' '}
                      registers on the platform, the owner can verify you to unlock attendance,
                      classes and PT bookings.
                    </>
                  )}
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
