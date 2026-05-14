import { useState, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrgBranding } from '@/hooks/useOrgBranding';
import { buildUpiLink, buildWhatsAppShareUrl, buildSmsUrl } from '@/lib/upi';
import { Copy, MessageCircle, Smartphone, QrCode, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Props {
  organizationId?: string;
  amount: number | string;
  memberName?: string;
  memberPhone?: string | null;
  invoiceRef?: string;
  trigger?: React.ReactNode;
}

export default function UPIPaymentLinkDialog({
  organizationId,
  amount,
  memberName,
  memberPhone,
  invoiceRef,
  trigger,
}: Props) {
  const { data: branding } = useOrgBranding(organizationId);
  const [open, setOpen] = useState(false);
  const [editAmount, setEditAmount] = useState(String(amount));

  const vpa = branding?.upi_vpa || '';
  const payeeName = branding?.upi_payee_name || 'Gym';

  const upiLink = useMemo(
    () =>
      vpa
        ? buildUpiLink({
            vpa,
            payeeName,
            amount: editAmount,
            note: invoiceRef ? `Payment ${invoiceRef}` : 'Membership payment',
            txnRef: invoiceRef,
          })
        : '',
    [vpa, payeeName, editAmount, invoiceRef]
  );

  const shareMessage = `Hi ${memberName || ''}, please pay ₹${editAmount} for your gym membership.\n\nTap to pay: ${upiLink}\n\nOr UPI ID: ${vpa}`;

  const copy = (txt: string, label: string) => {
    navigator.clipboard.writeText(txt);
    toast.success(`${label} copied`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-1.5">
            <QrCode className="w-3.5 h-3.5" /> UPI
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send UPI Payment Link</DialogTitle>
        </DialogHeader>

        {!vpa ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-medium text-foreground">UPI ID not set</p>
                <p className="text-muted-foreground mt-1">
                  Add your gym's UPI ID and payee name in Branding settings before sharing payment links.
                </p>
              </div>
            </div>
            <Link to="#" onClick={() => setOpen(false)}>
              <Button className="w-full">Go to Branding</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs">Amount (₹)</Label>
              <Input
                type="number"
                value={editAmount}
                onChange={e => setEditAmount(e.target.value)}
              />
            </div>

            <div className="flex justify-center bg-white p-4 rounded-xl">
              <QRCodeCanvas value={upiLink} size={180} includeMargin={false} />
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">UPI ID</span>
                <button onClick={() => copy(vpa, 'UPI ID')} className="font-medium flex items-center gap-1">
                  {vpa} <Copy className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Payee</span>
                <span className="font-medium">{payeeName}</span>
              </div>
              {invoiceRef && (
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Ref</span>
                  <span className="font-medium">{invoiceRef}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                asChild
              >
                <a href={buildWhatsAppShareUrl(memberPhone, shareMessage)} target="_blank" rel="noreferrer">
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                asChild
              >
                <a href={buildSmsUrl(memberPhone, shareMessage)}>
                  <Smartphone className="w-3.5 h-3.5" /> SMS
                </a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => copy(upiLink, 'UPI link')}
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </Button>
            </div>

            <Button
              size="sm"
              className="w-full"
              asChild
            >
              <a href={upiLink}>Open in UPI App (mobile)</a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
