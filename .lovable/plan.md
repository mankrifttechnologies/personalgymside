## Communication Hub Module

### Scope
Build in-app communication tools for gym owners to reach members via the existing messaging system (no external SMS/email needed initially).

### Components to Build

1. **Bulk Notification Sender** (`src/components/admin/BulkNotifier.tsx`)
   - Send announcements to all members or filtered groups (by tier, status, activity)
   - Uses existing `messages` table for delivery
   - Preview before sending

2. **Automated Greetings** (`src/components/admin/AutoGreetings.tsx`)
   - Birthday greeting cards (based on profile age/DOB)
   - Membership anniversary messages
   - Welcome message for newly approved members

3. **Payment Reminder System** (`src/components/admin/PaymentReminders.tsx`)
   - View overdue/pending payments
   - One-tap send reminder message to member
   - Bulk remind all overdue members

4. **Feedback Collector** (`src/components/admin/FeedbackCollector.tsx`)
   - Create simple feedback/survey forms
   - Members see feedback requests in their feed
   - Admin views aggregated responses

### Database Changes
- New `feedback_forms` table (id, title, questions JSON, created_by, is_active)
- New `feedback_responses` table (id, form_id, user_id, answers JSON)

### Integration
- Add "Comms" tab to Admin Dashboard
- Wire bulk messaging through existing `messages` table
- Payment reminders query `payment_records` for overdue entries
