import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  member_name: string;
  member_phone?: string | null;
  member_email?: string | null;
  plan_name: string;
  base_amount: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  total_amount: number;
  currency: string;
  payment_method?: string | null;
  notes?: string | null;
  status: string;
}

export interface BrandingData {
  org_name: string;
  logo_url?: string | null;
  brand_color?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  gst_number?: string | null;
  upi_vpa?: string | null;
  upi_payee_name?: string | null;
  invoice_prefix?: string;
}

const fmtINR = (n: number) => `Rs. ${Number(n).toFixed(2)}`;

async function buildUpiQr(vpa: string, payee: string, amount: number, note: string): Promise<string | null> {
  try {
    const url = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(payee)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
    return await QRCode.toDataURL(url, { width: 200, margin: 1 });
  } catch {
    return null;
  }
}

export async function generateInvoicePDF(invoice: InvoiceData, branding: BrandingData): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  let y = 15;

  // Header bar
  const brandColor = branding.brand_color || '#0EA5E9';
  doc.setFillColor(brandColor);
  doc.rect(0, 0, pageW, 8, 'F');

  // Org name
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(branding.org_name || 'Gym', 15, y + 8);

  // Invoice title (right)
  doc.setFontSize(22);
  doc.setTextColor(brandColor);
  doc.text('TAX INVOICE', pageW - 15, y + 8, { align: 'right' });

  y += 16;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  if (branding.address) doc.text(branding.address, 15, y);
  y += 4;
  const contact = [branding.phone, branding.email].filter(Boolean).join(' • ');
  if (contact) doc.text(contact, 15, y);
  y += 4;
  if (branding.gst_number) {
    doc.setFont('helvetica', 'bold');
    doc.text(`GSTIN: ${branding.gst_number}`, 15, y);
    doc.setFont('helvetica', 'normal');
  }

  // Invoice meta (right column)
  let metaY = 31;
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('Invoice #', pageW - 60, metaY);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.invoice_number, pageW - 15, metaY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  metaY += 5;
  doc.text('Date', pageW - 60, metaY);
  doc.setFont('helvetica', 'bold');
  doc.text(new Date(invoice.invoice_date).toLocaleDateString('en-IN'), pageW - 15, metaY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  metaY += 5;
  doc.text('Status', pageW - 60, metaY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(invoice.status === 'paid' ? '#16a34a' : '#dc2626');
  doc.text(invoice.status.toUpperCase(), pageW - 15, metaY, { align: 'right' });
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');

  // Bill to
  y = 55;
  doc.setDrawColor(220);
  doc.line(15, y, pageW - 15, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text('BILL TO', 15, y);
  y += 5;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20);
  doc.text(invoice.member_name, 15, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80);
  if (invoice.member_phone) { y += 4; doc.text(invoice.member_phone, 15, y); }
  if (invoice.member_email) { y += 4; doc.text(invoice.member_email, 15, y); }

  // Items table
  y += 10;
  doc.setFillColor(245, 245, 245);
  doc.rect(15, y, pageW - 30, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60);
  doc.text('DESCRIPTION', 18, y + 5.5);
  doc.text('AMOUNT', pageW - 18, y + 5.5, { align: 'right' });
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(20);
  doc.text(invoice.plan_name, 18, y);
  doc.text(fmtINR(invoice.base_amount), pageW - 18, y, { align: 'right' });
  y += 8;
  doc.setDrawColor(230);
  doc.line(15, y, pageW - 15, y);
  y += 6;

  // Tax breakdown
  doc.setFontSize(9);
  doc.setTextColor(80);
  const labelX = pageW - 70;
  const valX = pageW - 18;

  doc.text('Subtotal', labelX, y);
  doc.text(fmtINR(invoice.base_amount), valX, y, { align: 'right' });
  y += 5;
  doc.text(`CGST @ ${invoice.cgst_rate}%`, labelX, y);
  doc.text(fmtINR(invoice.cgst_amount), valX, y, { align: 'right' });
  y += 5;
  doc.text(`SGST @ ${invoice.sgst_rate}%`, labelX, y);
  doc.text(fmtINR(invoice.sgst_amount), valX, y, { align: 'right' });
  y += 5;
  doc.setDrawColor(180);
  doc.line(labelX, y, valX, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.text('TOTAL', labelX, y);
  doc.setTextColor(brandColor);
  doc.text(fmtINR(invoice.total_amount), valX, y, { align: 'right' });
  y += 10;

  // UPI QR
  if (branding.upi_vpa && invoice.status !== 'paid') {
    const qr = await buildUpiQr(
      branding.upi_vpa,
      branding.upi_payee_name || branding.org_name,
      invoice.total_amount,
      invoice.invoice_number
    );
    if (qr) {
      doc.setFillColor(250, 250, 250);
      doc.rect(15, y, 80, 50, 'F');
      doc.addImage(qr, 'PNG', 18, y + 3, 44, 44);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(20);
      doc.text('Pay via UPI', 65, y + 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80);
      doc.text('Scan with any UPI app', 65, y + 18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(branding.upi_vpa, 65, y + 26);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(branding.upi_payee_name || branding.org_name, 65, y + 32);
      y += 55;
    }
  }

  // Notes / footer
  if (invoice.notes) {
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(`Notes: ${invoice.notes}`, 15, y);
    y += 6;
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(
    'This is a computer-generated invoice. Thank you for your business.',
    pageW / 2,
    285,
    { align: 'center' }
  );

  return doc.output('blob');
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
