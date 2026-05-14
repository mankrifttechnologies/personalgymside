## Top 5 Owner-Focused Features — Implementation Plan

Building the five highest-impact monetization features for gym owners. Each ships as a self-contained module on the Owner Dashboard.

---

### 1. UPI Payment Links + Auto-Dunning

**What it does:** Owner generates a UPI deep link / QR per overdue invoice. Member taps → opens GPay/PhonePe/Paytm pre-filled with amount + note. Owner gets notified, marks paid → invoice closes + dunning stops.

**Build:**
- DB: add `upi_vpa`, `upi_link`, `upi_qr_url` to `payment_records`. Add `upi_vpa` to `organization_branding` (gym's own UPI ID).
- Component: `UPIPaymentLinkDialog.tsx` — generates `upi://pay?pa=...&pn=...&am=...&tn=INV-xxx` link, renders QR (qrcode.react already in deps), share button (WhatsApp/SMS).
- Wire into `MemberPaymentRecording.tsx` and `DunningTab` (existing dunning sweep already builds messages — append the UPI link token `{upi_link}` to templates).

---

### 2. Trial-to-Paid Conversion Pipeline

**What it does:** Owner starts a free trial for a lead/member (3/7/14 days). System auto-tracks trial expiry, sends reminders at -3/-1/0/+1 days, and shows owner a conversion kanban (Trial → Converted → Lost).

**Build:**
- DB: new `trials` table (`member_id`, `lead_id`, `start_date`, `end_date`, `status` [active/converted/lost], `plan_id`, `notes`).
- Hook: `useTrials.tsx` (CRUD + conversion stats).
- Component: `TrialPipeline.tsx` — kanban cards by status, "Convert to paid" button (creates `payment_records` row + closes trial).
- Auto-seed dunning queue rows on trial expiry windows.

---

### 3. WhatsApp Re-engagement for Inactive Members

**What it does:** Detect members with no check-in in 7/14/30 days. Owner taps a card → opens WhatsApp `wa.me/<phone>?text=<template>`. Templates editable per gym.

**Build:**
- DB: add `phone` to `profiles` (already missing — see dunning hook comment "phone not yet on profiles"). Add `reengagement_templates` table.
- Hook: `useInactiveMembers.tsx` — query `gym_members` LEFT JOIN latest `attendance_logs`, bucket by inactivity tier.
- Component: `ReengagementTab.tsx` — three buckets (7/14/30+ days), each row has WhatsApp + SMS + Mark-Contacted buttons.

---

### 4. Multi-Branch Dashboard

**What it does:** A single owner with multiple gyms (organizations) sees a branch-switcher and an "All branches" rollup with revenue/members/check-ins per branch.

**Build:**
- Hook: `useOwnerOrganizations.tsx` — list all orgs where `owner_id = auth.uid()`.
- Component: `BranchSwitcher.tsx` in `OwnerDashboard.tsx` header. Persists selected `organizationId` in `localStorage`.
- Component: `MultiBranchRollup.tsx` — when "All" selected, aggregates revenue/members/check-ins across orgs (grid of branch cards + combined KPIs).
- Refactor `OwnerDashboard.tsx` to read selected org from a tiny context instead of a single hardcoded fetch.

---

### 5. GST Invoices + Tax Export

**What it does:** Already partially built (`invoices` table with CGST/SGST). Add: PDF download with gym branding + GSTIN, GSTR-1-style monthly export (CSV), bulk-issue invoices for paid records missing one.

**Build:**
- DB: add `gstin`, `pan`, `business_address`, `state_code` to `organization_branding`.
- Lib: extend `src/lib/invoiceGenerator.ts` to render branded PDF (jsPDF) with header, GSTIN, HSN code, tax breakdown.
- Component: `TaxExportTab.tsx` — month picker → CSV with columns matching GSTR-1 B2C summary (invoice no, date, taxable value, CGST, SGST, total).
- Button "Generate missing invoices" in InvoicesTab → bulk-creates invoices for `payment_records` without one.

---

### Wiring & Navigation

Add three new tabs to `OwnerDashboard.tsx`:
- **Trials** (feature 2)
- **Re-engage** (feature 3)
- **Tax** (feature 5)

UPI (1) lives inside existing Payments + Dunning tabs. Branch switcher (4) lives in the dashboard header.

---

### Out of scope (call out)

- No actual WhatsApp Business API — uses `wa.me` deep links (free, no key needed). True automation needs Twilio/Gupshup later.
- No live UPI settlement webhook — owner manually marks paid. True auto-reconcile needs a payment gateway (Razorpay/Cashfree) later.
- No SMS gateway — SMS buttons open native `sms:` URI.

Both are explicit "phase 2" upgrades the owner can opt into.

---

Approve to start building. I'll ship in this order: **DB migrations → UPI (1) → Tax (5) → Branch switcher (4) → Trials (2) → Re-engagement (3)**, so the revenue-recovery features land first.
