import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ChevronLeft, QrCode, Loader2, CheckCircle2, ScanLine } from 'lucide-react';

export default function QRCheckIn() {
  const { user, loading: authLoading } = useAuth();
  const [memberCode, setMemberCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [checkInDone, setCheckInDone] = useState(false);
  const [memberName, setMemberName] = useState('');

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;

  const handleCheckIn = async () => {
    if (!memberCode.trim()) return;
    setProcessing(true);
    try {
      // Look up member by code
      const { data: member, error: memberError } = await supabase
        .from('gym_members')
        .select('id, user_id')
        .eq('member_code', memberCode.trim().toUpperCase())
        .maybeSingle();

      if (memberError) throw memberError;
      if (!member) {
        toast.error('Invalid member code');
        setProcessing(false);
        return;
      }

      // Get member name
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', member.user_id)
        .maybeSingle();

      // Check if already checked in today
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('attendance_logs')
        .select('id, check_out_time')
        .eq('member_id', member.id)
        .gte('check_in_time', today + 'T00:00:00')
        .is('check_out_time', null)
        .maybeSingle();

      if (existing) {
        // Check out
        const checkIn = new Date(today + 'T00:00:00');
        const now = new Date();
        const duration = Math.floor((now.getTime() - checkIn.getTime()) / 60000);

        const { error } = await supabase
          .from('attendance_logs')
          .update({ check_out_time: now.toISOString(), duration_minutes: duration, status: 'checked_out' })
          .eq('id', existing.id);
        if (error) throw error;

        toast.success(`${profile?.name || 'Member'} checked out!`);
        setMemberName(profile?.name || 'Member');
        setCheckInDone(true);
      } else {
        // Check in
        const { error } = await supabase
          .from('attendance_logs')
          .insert({
            member_id: member.id,
            check_in_time: new Date().toISOString(),
            status: 'checked_in',
            is_on_time: true,
          });
        if (error) throw error;

        toast.success(`${profile?.name || 'Member'} checked in! 💪`);
        setMemberName(profile?.name || 'Member');
        setCheckInDone(true);
      }
    } catch (err: any) {
      toast.error(err.message || 'Check-in failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen safe-area-top pb-8">
      <header className="p-4 flex items-center gap-3">
        <Link to="/owner">
          <Button variant="ghost" size="icon"><ChevronLeft className="w-6 h-6" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">QR Check-In</h1>
          <p className="text-sm text-muted-foreground">Scan or enter member code</p>
        </div>
      </header>

      <main className="px-4 max-w-md mx-auto space-y-4">
        {checkInDone ? (
          <Card className="animate-slide-up">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto text-accent mb-4" />
              <h2 className="text-xl font-bold mb-2">Done! ✅</h2>
              <p className="text-muted-foreground mb-4">{memberName} has been processed.</p>
              <Button className="w-full" onClick={() => { setCheckInDone(false); setMemberCode(''); }}>
                Scan Next Member
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center mb-3 relative">
                  <QrCode className="w-10 h-10 text-primary" />
                  <ScanLine className="w-14 h-14 text-primary/30 absolute animate-pulse" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter the member code shown on their digital membership card
                </p>
              </div>

              <Input
                value={memberCode}
                onChange={e => setMemberCode(e.target.value.toUpperCase())}
                placeholder="e.g. FIT12345"
                className="text-center font-mono text-lg tracking-widest"
              />

              <Button className="w-full" onClick={handleCheckIn} disabled={processing || !memberCode.trim()}>
                {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ScanLine className="w-4 h-4 mr-2" />}
                Process Check-In/Out
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
