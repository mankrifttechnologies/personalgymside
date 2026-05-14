import { useState, useMemo } from 'react';
import { useInvoices } from '@/hooks/useInvoices';
import { useOrgBranding } from '@/hooks/useOrgBranding';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Download, FileSpreadsheet, IndianRupee } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface Props { organizationId?: string }

export default function TaxExportTab({ organizationId }: Props) {
  const { data: invoices } = useInvoices(organizationId);
  const { data: branding } = useOrgBranding(organizationId);
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));

  const rows = useMemo(() => {
    if (!invoices?.length) return [];
    const [y, m] = month.split('-').map(Number);
    const start = startOfMonth(new Date(y, m - 1));
    const end = endOfMonth(new Date(y, m - 1));
    return invoices.filter(i => {
      const d = parseISO(i.invoice_date);
      return d >= start && d <= end && i.status !== 'cancelled';
    });
  }, [invoices, month]);

  const totals = useMemo(() => {
    return rows.reduce((acc, r) => ({
      taxable: acc.taxable + Number(r.base_amount),
      cgst: acc.cgst + Number(r.cgst_amount),
      sgst: acc.sgst + Number(r.sgst_amount),
      total: acc.total + Number(r.total_amount),
    }), { taxable: 0, cgst: 0, sgst: 0, total: 0 });
  }, [rows]);

  const exportCsv = () => {
    if (!rows.length) {
      toast.error('No invoices in this period');
      return;
    }
    const header = ['Invoice No', 'Date', 'GSTIN', 'Plan', 'Taxable Value', 'CGST Rate', 'CGST Amount', 'SGST Rate', 'SGST Amount', 'Total', 'Currency'];
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push([
        r.invoice_number,
        r.invoice_date,
        branding?.gstin || branding?.gst_number || '',
        `"${(r.plan_name || '').replace(/"/g, '""')}"`,
        r.base_amount,
        r.cgst_rate,
        r.cgst_amount,
        r.sgst_rate,
        r.sgst_amount,
        r.total_amount,
        r.currency,
      ].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gst-export-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} invoices`);
  };

  if (!organizationId) return <p className="text-sm text-muted-foreground">No organization selected.</p>;

  const gstin = branding?.gstin || branding?.gst_number;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-1">GSTR-1 ready exports</p>
        <p>Download a CSV summary of all invoices for any month, formatted for direct upload to your accounting software.</p>
      </div>

      {!gstin && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-3 text-xs">
            <p className="font-medium text-foreground">Add your GSTIN</p>
            <p className="text-muted-foreground mt-0.5">Set it in Branding → GST details so it appears on every invoice & export.</p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-end gap-2">
        <div className="space-y-1.5 flex-1">
          <Label className="text-xs">Period</Label>
          <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
        </div>
        <Button onClick={exportCsv} className="gap-1.5">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase">Invoices</p><p className="text-lg font-bold">{rows.length}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase">Total Sales</p><p className="text-lg font-bold">₹{totals.total.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase">CGST</p><p className="text-lg font-bold">₹{totals.cgst.toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground uppercase">SGST</p><p className="text-lg font-bold">₹{totals.sgst.toFixed(2)}</p></CardContent></Card>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Invoices in {month}</h3>
        <div className="space-y-1.5">
          {rows.length === 0 && (
            <Card><CardContent className="p-6 text-center text-muted-foreground">
              <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No invoices for this period</p>
            </CardContent></Card>
          )}
          {rows.map(r => (
            <Card key={r.id}>
              <CardContent className="p-2.5 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono truncate">{r.invoice_number}</p>
                  <p className="text-[10px] text-muted-foreground">{format(parseISO(r.invoice_date), 'dd MMM')} • {r.plan_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold flex items-center justify-end"><IndianRupee className="w-3 h-3" />{Number(r.total_amount).toLocaleString()}</p>
                  <Badge variant="outline" className="text-[9px]">{r.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
