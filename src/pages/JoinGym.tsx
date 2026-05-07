import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ChevronLeft, Building2, Loader2, CheckCircle2, Search } from 'lucide-react';
import AuthQuickLinks from '@/components/AuthQuickLinks';

export default function JoinGym() {
  const { user, loading: authLoading } = useAuth();
  const [code, setCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [joining, setJoining] = useState(false);
  const [foundOrg, setFoundOrg] = useState<{ id: string; name: string } | null>(null);
  const [joined, setJoined] = useState(false);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;

  const handleSearch = async () => {
    if (!code.trim()) return;
    setSearching(true);
    setFoundOrg(null);
    try {
      const { data, error } = await supabase.rpc('get_org_by_gym_code', { code: code.trim().toUpperCase() });
      if (error) throw error;
      if (data && data.length > 0) {
        setFoundOrg({ id: data[0].id, name: data[0].name });
      } else {
        toast.error('No gym found with that code');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to search');
    } finally {
      setSearching(false);
    }
  };

  const handleJoin = async () => {
    if (!foundOrg || !user) return;
    setJoining(true);
    try {
      // Check if already a member
      const { data: existing } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', foundOrg.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        toast.info('You are already a member of this gym!');
        setJoined(true);
        setJoining(false);
        return;
      }

      // Add to organization_members
      const { error: omError } = await supabase.from('organization_members').insert({
        organization_id: foundOrg.id,
        user_id: user.id,
        role: 'member',
        status: 'active',
      });
      if (omError) throw omError;

      // Also create gym_members record if not exists
      const { data: existingGym } = await supabase
        .from('gym_members')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingGym) {
        const { error: gmError } = await supabase.from('gym_members').insert({
          user_id: user.id,
          member_code: 'FIT' + Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
          organization_id: foundOrg.id,
          status: 'active',
          is_verified: false,
        } as any);
        if (gmError) throw gmError;
      }

      toast.success(`Joined ${foundOrg.name}! Awaiting verification 🎉`);
      setJoined(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to join');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen safe-area-top pb-8">
      <header className="p-4 flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="icon"><ChevronLeft className="w-6 h-6" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Join a Gym</h1>
          <p className="text-sm text-muted-foreground">Enter your gym's code to join</p>
        </div>
      </header>

      <main className="px-4 space-y-4 max-w-md mx-auto">
        {joined ? (
          <Card className="animate-slide-up">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto text-accent mb-4" />
              <h2 className="text-xl font-bold mb-2">You're In! 🎉</h2>
              <p className="text-muted-foreground mb-4">You've successfully joined {foundOrg?.name}</p>
              <Link to="/">
                <Button className="w-full">Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="text-center mb-2">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center mb-3">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ask your gym owner for the gym code, then enter it below
                  </p>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter gym code (e.g. ABC123)"
                    className="text-center font-mono text-lg tracking-widest uppercase"
                    maxLength={6}
                  />
                  <Button onClick={handleSearch} disabled={searching || !code.trim()} size="icon">
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {foundOrg && (
              <Card className="animate-slide-up border-primary/30">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-primary/15">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{foundOrg.name}</p>
                      <p className="text-xs text-muted-foreground">Gym found!</p>
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleJoin} disabled={joining}>
                    {joining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Join This Gym
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4">
                <AuthQuickLinks />
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
