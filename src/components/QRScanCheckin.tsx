import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ScanLine, CheckCircle2, XCircle, Loader2, Camera, X } from 'lucide-react';

export default function QRScanCheckin() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [resultMsg, setResultMsg] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-reader';

  const startScanner = async () => {
    setScanning(true);
    setResult(null);

    // On Android/Capacitor WebView and modern browsers, explicitly request the
    // camera first so the OS permission prompt fires reliably. html5-qrcode
    // sometimes silently fails on Capacitor when permission has not been
    // granted yet.
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });
        // Immediately stop — html5-qrcode will reopen with its own pipeline.
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch (permErr: any) {
      setScanning(false);
      const msg =
        permErr?.name === 'NotAllowedError'
          ? 'Camera permission denied. Enable it in your device settings to scan.'
          : 'Camera not available on this device.';
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
          await scanner.stop();
          scannerRef.current = null;
          setScanning(false);
          handleQRCode(decodedText);
        },
        () => {} // ignore errors during scanning
      );
    } catch (err: any) {
      setScanning(false);
      toast.error(err?.message || 'Could not start the QR scanner. Try again.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const handleQRCode = async (code: string) => {
    if (!user?.id) return;
    setProcessing(true);

    try {
      // Validate QR code
      const { data: qrCode, error: qrError } = await supabase
        .from('daily_qr_codes')
        .select('*')
        .eq('code', code)
        .eq('valid_date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (qrError) throw qrError;
      if (!qrCode) {
        setResult('error');
        setResultMsg('Invalid or expired QR code');
        return;
      }

      // Get member record
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
        const now = new Date();
        const { error } = await supabase
          .from('attendance_logs')
          .update({
            check_out_time: now.toISOString(),
            duration_minutes: Math.floor((now.getTime() - new Date(today + 'T00:00:00').getTime()) / 60000),
            status: 'checked_out',
          })
          .eq('id', existing.id);
        if (error) throw error;
        setResult('success');
        setResultMsg('Checked out successfully! 👋');
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
        setResult('success');
        setResultMsg('Checked in successfully! 💪');
      }
    } catch (err: any) {
      setResult('error');
      setResultMsg(err.message || 'Check-in failed');
    } finally {
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm font-medium">Processing check-in...</p>
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
          <Button variant="outline" onClick={() => setResult(null)} className="rounded-xl">
            Scan Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {scanning ? (
          <div className="relative">
            <div id={containerId} className="w-full" style={{ minHeight: 280 }} />
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
              <p className="font-semibold text-sm mb-0.5">QR Check-In</p>
              <p className="text-xs text-muted-foreground">Scan your gym's daily QR code to check in</p>
            </div>
            <Button onClick={startScanner} className="gap-2 rounded-xl w-full">
              <Camera className="w-4 h-4" />
              Open Scanner
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
