import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  Loader2,
  Camera,
  X,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

type ScannerState = 'idle' | 'starting' | 'scanning' | 'detected';

interface QRScanCheckinProps {
  /** Called shortly after a successful check-in/out so the host (sheet/dialog) can auto-close. */
  onSuccess?: () => void;
}

export default function QRScanCheckin({ onSuccess }: QRScanCheckinProps = {}) {
  const { user } = useAuth();
  const [state, setState] = useState<ScannerState>('idle');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [resultMsg, setResultMsg] = useState('');
  const [startError, setStartError] = useState<string | null>(null);
  const [secondsScanning, setSecondsScanning] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startTimeoutRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const containerId = 'qr-reader';

  const clearTimers = () => {
    if (startTimeoutRef.current) {
      window.clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const stopScanner = async () => {
    clearTimers();
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    }
    setState('idle');
    setSecondsScanning(0);
  };

  const startScanner = async () => {
    setStartError(null);
    setResult(null);
    setSecondsScanning(0);
    setState('starting');

    // 12s safety timeout: if camera never starts, surface an error.
    startTimeoutRef.current = window.setTimeout(async () => {
      if (state !== 'scanning') {
        setStartError("Camera is taking too long to start. Try again, or use the manual code option below.");
        await stopScanner();
      }
    }, 12000);

    // Pre-request camera permission so the OS prompt fires reliably on
    // Capacitor/Android WebView before html5-qrcode opens its own pipeline.
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch (permErr: any) {
      clearTimers();
      setState('idle');
      const msg =
        permErr?.name === 'NotAllowedError'
          ? 'Camera permission denied. Enable it in your device settings to scan.'
          : 'Camera not available on this device.';
      setStartError(msg);
      toast.error(msg);
      return;
    }

    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          setState('detected');
          clearTimers();
          try {
            await scanner.stop();
            await scanner.clear();
          } catch {
            /* ignore */
          }
          scannerRef.current = null;
          handleQRCode(decodedText);
        },
        () => {
          /* ignore per-frame decode errors */
        }
      );

      // Camera is live now.
      clearTimers();
      setState('scanning');
      tickRef.current = window.setInterval(() => {
        setSecondsScanning((s) => s + 1);
      }, 1000);
    } catch (err: any) {
      clearTimers();
      setState('idle');
      const msg = err?.message || 'Could not start the QR scanner. Try again.';
      setStartError(msg);
      toast.error(msg);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQRCode = async (code: string) => {
    if (!user?.id) return;
    setProcessing(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: qrCode, error: qrError } = await supabase
        .from('daily_qr_codes')
        .select('*')
        .eq('code', code)
        .eq('valid_date', today)
        .maybeSingle();

      if (qrError) throw qrError;
      if (!qrCode) {
        setResult('error');
        setResultMsg('Invalid or expired QR code');
        return;
      }

      const { data: member, error: memberError } = await supabase
        .from('gym_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', qrCode.organization_id)
        .maybeSingle();

      if (memberError) throw memberError;
      if (!member) {
        setResult('error');
        setResultMsg('You are not a member of this gym');
        return;
      }

      const { data: openSession } = await supabase
        .from('attendance_logs')
        .select('id, check_in_time')
        .eq('member_id', member.id)
        .gte('check_in_time', today + 'T00:00:00')
        .is('check_out_time', null)
        .maybeSingle();

      const qrType = (qrCode as any).qr_type ?? 'checkin';

      if (qrType === 'checkin') {
        if (openSession) {
          setResult('error');
          setResultMsg("You're already checked in. Scan the Check-Out QR when leaving.");
          return;
        }
        const { error } = await supabase.from('attendance_logs').insert({
          member_id: member.id,
          check_in_time: new Date().toISOString(),
          status: 'checked_in',
          is_on_time: true,
        });
        if (error) throw error;
        setResult('success');
        setResultMsg('Checked in successfully! 💪');
        if (onSuccess) window.setTimeout(() => onSuccess(), 1600);
      } else {
        if (!openSession) {
          setResult('error');
          setResultMsg("You haven't checked in today. Scan the Check-In QR first.");
          return;
        }
        const now = new Date();
        const checkInDate = new Date(openSession.check_in_time);
        const { error } = await supabase
          .from('attendance_logs')
          .update({
            check_out_time: now.toISOString(),
            duration_minutes: Math.max(
              1,
              Math.floor((now.getTime() - checkInDate.getTime()) / 60000)
            ),
            status: 'checked_out',
          })
          .eq('id', openSession.id);
        if (error) throw error;
        setResult('success');
        setResultMsg('Checked out successfully! 👋');
        if (onSuccess) window.setTimeout(() => onSuccess(), 1600);
      }
    } catch (err: any) {
      setResult('error');
      setResultMsg(err.message || 'Scan failed');
    } finally {
      setProcessing(false);
    }
  };

  // ---------- Render states ----------

  if (processing) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm font-medium">Processing your scan…</p>
          <p className="text-xs text-muted-foreground mt-1">Just a moment</p>
        </CardContent>
      </Card>
    );
  }

  if (result) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          {result === 'success' ? (
            <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-3" />
          ) : (
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          )}
          <p className="font-semibold mb-1">{result === 'success' ? 'Done!' : 'Oops!'}</p>
          <p className="text-sm text-muted-foreground mb-4">{resultMsg}</p>
          <Button
            variant="outline"
            onClick={() => setResult(null)}
            className="rounded-xl"
          >
            Scan Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isCameraOpen = state === 'starting' || state === 'scanning' || state === 'detected';
  const showSlowHint = state === 'scanning' && secondsScanning >= 10;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {isCameraOpen ? (
          <div className="relative bg-black">
            {/* Always-mounted reader container so html5-qrcode can attach */}
            <div
              id={containerId}
              className="w-full"
              style={{ minHeight: 320 }}
            />

            {/* Starting overlay */}
            {state === 'starting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white text-center px-6">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p className="text-sm font-medium">Starting camera…</p>
                <p className="text-xs text-white/70 mt-1">
                  Allow camera access if prompted
                </p>
              </div>
            )}

            {/* Detected overlay */}
            {state === 'detected' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white text-center px-6">
                <CheckCircle2 className="w-10 h-10 text-accent mb-2" />
                <p className="text-sm font-medium">QR detected</p>
              </div>
            )}

            {/* Scanning guide overlay */}
            {state === 'scanning' && (
              <>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative w-[250px] h-[250px]">
                    {/* Corner brackets */}
                    <span className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                    <span className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                    <span className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                    <span className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-primary rounded-br-lg" />
                    {/* Animated scan line */}
                    <span className="absolute left-2 right-2 top-1/2 h-0.5 bg-primary/80 shadow-[0_0_12px_2px_hsl(var(--primary))] animate-pulse" />
                  </div>
                </div>

                <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center px-4">
                  <div className="bg-background/85 backdrop-blur rounded-full px-3 py-1.5 flex items-center gap-2 text-xs font-medium">
                    <ScanLine className="w-3.5 h-3.5 text-primary" />
                    Place QR in view
                  </div>
                </div>

                {showSlowHint && (
                  <div className="absolute top-3 left-3 right-12 bg-background/90 backdrop-blur rounded-xl px-3 py-2 flex items-start gap-2 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-foreground">
                      Trouble scanning? Hold steady, ensure good lighting, and keep the QR fully inside the frame.
                    </span>
                  </div>
                )}
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={stopScanner}
              className="absolute top-2 right-2 bg-background/80 backdrop-blur rounded-full z-10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <div className="p-5 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center relative">
              <ScanLine className="w-8 h-8 text-primary" />
              <ScanLine className="w-12 h-12 text-primary/20 absolute animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-sm mb-0.5">QR Attendance</p>
              <p className="text-xs text-muted-foreground">
                Scan your gym's check-in or check-out QR code
              </p>
            </div>

            {startError && (
              <div className="text-left bg-destructive/10 border border-destructive/30 rounded-xl px-3 py-2 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{startError}</p>
              </div>
            )}

            <Button onClick={startScanner} className="gap-2 rounded-xl w-full">
              {startError ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  Open Scanner
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
