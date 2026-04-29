import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, RefreshCw, Loader2, CheckCircle2, Calendar, LogIn, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DailyQRGeneratorProps {
  organizationId: string;
}

type QRType = 'checkin' | 'checkout';

interface QRCardProps {
  organizationId: string;
  qrType: QRType;
  today: string;
}

function QRCard({ organizationId, qrType, today }: QRCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isCheckin = qrType === 'checkin';
  const label = isCheckin ? 'Check-In' : 'Check-Out';
  const Icon = isCheckin ? LogIn : LogOut;
  const accentClass = isCheckin ? 'text-primary bg-primary/15' : 'text-accent bg-accent/15';

  const { data: qr, isLoading } = useQuery({
    queryKey: ['daily-qr', organizationId, today, qrType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_qr_codes')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('valid_date', today)
        .eq('qr_type', qrType)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const generateQR = useMutation({
    mutationFn: async () => {
      const code = `GYM-${qrType.toUpperCase()}-${organizationId.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const { data, error } = await supabase
        .from('daily_qr_codes')
        .insert({
          organization_id: organizationId,
          code,
          valid_date: today,
          qr_type: qrType,
          created_by: user!.id,
        })
        .select()
        .single();
      if (error) {
        if (error.code === '23505') throw new Error(`${label} QR already generated for today`);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-qr', organizationId, today, qrType] });
      toast.success(`${label} QR generated!`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-2 rounded-lg ${accentClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{label} QR</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(), 'EEE, MMM d')}
            </p>
          </div>
        </div>

        {qr ? (
          <div className="text-center space-y-3">
            <div className="inline-block p-4 bg-white rounded-2xl shadow-sm">
              <QRCodeSVG value={qr.code} size={180} level="H" includeMargin={false} />
            </div>
            <div className="flex items-center justify-center gap-1.5 text-sm text-accent">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-medium">Active for today</span>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono break-all px-2">{qr.code}</p>
          </div>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center">
              <QrCode className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">No {label.toLowerCase()} QR yet</p>
            <Button
              onClick={() => generateQR.mutate()}
              disabled={generateQR.isPending}
              className="gap-2 w-full"
              size="sm"
            >
              {generateQR.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Generate {label} QR
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DailyQRGenerator({ organizationId }: DailyQRGeneratorProps) {
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <QRCard organizationId={organizationId} qrType="checkin" today={today} />
        <QRCard organizationId={organizationId} qrType="checkout" today={today} />
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Members scan the Check-In QR when arriving and the Check-Out QR when leaving.
      </p>
    </div>
  );
}
