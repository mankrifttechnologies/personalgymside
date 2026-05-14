/**
 * UPI deep-link helpers. Generates `upi://pay` URIs that open
 * GPay/PhonePe/Paytm/etc with amount + note pre-filled.
 *
 * Spec: https://www.npci.org.in/PDF/npci/upi/UPI-Linking-Specs_ver_1.6.pdf
 */
export interface UpiLinkParams {
  vpa: string;          // payee virtual address (e.g. gym@upi)
  payeeName: string;    // recipient display name
  amount?: number | string;
  note?: string;        // tn= transaction note
  txnRef?: string;      // tr= invoice / reference id
  currency?: string;    // cu= default INR
}

export function buildUpiLink({
  vpa,
  payeeName,
  amount,
  note,
  txnRef,
  currency = 'INR',
}: UpiLinkParams): string {
  const params = new URLSearchParams();
  params.set('pa', vpa);
  params.set('pn', payeeName);
  if (amount !== undefined && amount !== '') params.set('am', String(amount));
  params.set('cu', currency);
  if (note) params.set('tn', note);
  if (txnRef) params.set('tr', txnRef);
  return `upi://pay?${params.toString()}`;
}

export function buildWhatsAppShareUrl(phone: string | null | undefined, message: string): string {
  const cleaned = (phone || '').replace(/\D/g, '');
  return cleaned
    ? `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildSmsUrl(phone: string | null | undefined, message: string): string {
  const cleaned = (phone || '').replace(/\D/g, '');
  return `sms:${cleaned}?&body=${encodeURIComponent(message)}`;
}
