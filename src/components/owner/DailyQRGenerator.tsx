import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, RefreshCw, Loader2, CheckCircle2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DailyQRGeneratorProps {
  organizationId: string;
}

export default function DailyQRGenerator({ organizationId }: DailyQRGeneratorProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: todayQR, isLoading } = useQuery({
    queryKey: ['daily-qr', organizationId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_qr_codes')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('valid_date', today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const generateQR = useMutation({
    mutationFn: async () => {
      const code = `GYM-${organizationId.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const { data, error } = await supabase
        .from('daily_qr_codes')
        .insert({
          organization_id: organizationId,
          code,
          valid_date: today,
          created_by: user!.id,
        })
        .select()
        .single();
      if (error) {
        if (error.code === '23505') throw new Error('QR code already generated for today');
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-qr', organizationId, today] });
      toast.success('Daily QR code generated!');
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
          <div className="p-2 rounded-lg bg-primary/15">
            <QrCode className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Daily Attendance QR</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(), 'EEEE, MMM d, yyyy')}
            </p>
          </div>
        </div>

        {todayQR ? (
          <div className="text-center space-y-3">
            <div className="inline-block p-4 bg-white rounded-2xl shadow-sm">
              <QRCodeSVG
                value={todayQR.code}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>
            <div className="flex items-center justify-center gap-1.5 text-sm text-accent">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-medium">Active for today</span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{todayQR.code}</p>
            <p className="text-xs text-muted-foreground">
              Members can scan this QR code to check in
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center">
              <QrCode className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">No QR code for today</p>
              <p className="text-xs text-muted-foreground">Generate a QR code for members to scan</p>
            </div>
            <Button
              onClick={() => generateQR.mutate()}
              disabled={generateQR.isPending}
              className="gap-2"
            >
              {generateQR.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Generate Today's QR
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
