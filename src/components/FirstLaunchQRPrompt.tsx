import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import QRScanCheckin from '@/components/QRScanCheckin';
import { ScanLine, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Shows a one-time-per-day prompt to members on app open asking them to
 * scan the gym's daily QR code for attendance. Stored per user+date in
 * localStorage so it doesn't nag after a successful skip/scan.
 */
export default function FirstLaunchQRPrompt() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const key = `qr_prompt_seen_${user.id}_${today}`;
    if (localStorage.getItem(key)) return;

    // Only show if user is a gym member and hasn't already checked in today
    (async () => {
      const { data: member } = await supabase
        .from('gym_members')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!member) return;

      const { data: existing } = await supabase
        .from('attendance_logs')
        .select('id')
        .eq('member_id', member.id)
        .gte('check_in_time', today + 'T00:00:00')
        .maybeSingle();
      if (existing) return;

      setTimeout(() => setOpen(true), 800);
    })();
  }, [user]);

  const dismiss = () => {
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`qr_prompt_seen_${user.id}_${today}`, '1');
    }
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && dismiss()}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-6 pt-4 max-h-[92dvh] overflow-y-auto">
        <SheetHeader className="text-left mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center">
                <ScanLine className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base">Mark today's attendance</SheetTitle>
                <SheetDescription className="text-xs">
                  Scan the QR code displayed on your gym's door to check in instantly.
                </SheetDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={dismiss} className="rounded-full -mr-1">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </SheetHeader>
        <QRScanCheckin />
        <Button variant="ghost" onClick={dismiss} className="w-full mt-3 text-muted-foreground">
          Skip for now
        </Button>
      </SheetContent>
    </Sheet>
  );
}
