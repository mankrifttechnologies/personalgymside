# Google Antigravity Prompt — Build "FitAI Coach" Flutter Mobile App

Copy everything inside the `--- PROMPT START ---` / `--- PROMPT END ---` block below and paste it into Google Antigravity as the initial task prompt for a **new Flutter project**. Attach `FLUTTER_HANDOFF_SCOPE_OF_WORK.md` from this repo as a reference file in the same task so Antigravity can ground every screen, table, and edge function against the real spec.

---

--- PROMPT START ---

You are a senior Flutter engineer. Create a **new, production-grade Flutter 3.x mobile application** (iOS + Android) called **FitAI Coach** that is a 1:1 native port of an existing React + Vite + TypeScript web app already running on Lovable Cloud (Supabase). The full functional spec is provided in the attached `FLUTTER_HANDOFF_SCOPE_OF_WORK.md` — treat it as the single source of truth. Do not invent features that are not in that document.

## 1. Project setup
- Flutter stable, Dart 3, null-safe, Material 3.
- State management: **Riverpod 2** (`flutter_riverpod` + `riverpod_generator`).
- Routing: **go_router** with declarative routes mirroring the web routes listed in the handoff (`/workout`, `/nutrition`, `/profile`, `/progress`, `/measurements`, `/records`, `/templates`, `/reminders`, `/schedule`, `/friends`, `/history`, `/attendance`, `/leaderboard`, `/rewards`, `/explorer`, `/messages`, `/membership`, `/classes`, `/duels`, `/mobility`, `/pt-sessions`, `/owner`, `/admin`, `/trainer`, `/support`, `/auth`, `/register`, `/register-owner`, `/register-org`, `/forgot-password`, `/reset-password`, `/join-gym`, `/qr-checkin`, `/market`, `/g/:gymCode`).
- Backend SDK: **`supabase_flutter`**. Reuse the existing Lovable Cloud project — do **not** create a new backend. Use these credentials:
  - `SUPABASE_URL = https://kuozzcrmeqoawhnlvslv.supabase.co`
  - `SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1b3p6Y3JtZXFvYXdobmx2c2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5Mjg1MDQsImV4cCI6MjA4MjUwNDUwNH0.9b80dXAoV4zGhylnfBfIyUVFe-Ykqv7J7sBr3_JoSqk`
- Load via `--dart-define` and a `lib/core/env.dart` wrapper. Never hardcode in widgets.

## 2. Required packages
`flutter_riverpod`, `riverpod_annotation`, `go_router`, `supabase_flutter`, `freezed`, `json_serializable`, `dio`, `cached_network_image`, `flutter_secure_storage`, `hive`, `hive_flutter`, `sqflite`, `mobile_scanner` (QR check-in), `qr_flutter` (membership card QR), `firebase_core` + `firebase_messaging` (push), `flutter_local_notifications`, `image_picker`, `camera`, `url_launcher` (WhatsApp + UPI deep links), `share_plus`, `intl`, `google_fonts` (Outfit), `fl_chart` (analytics), `lottie`, `permission_handler`, `connectivity_plus`, `flutter_svg`, `shimmer`, `cached_network_image`.

## 3. Design system (must match web exactly)
- Font: **Outfit** via `google_fonts` for all text.
- Theme: dark-first, with a light theme. Convert these HSL tokens to Flutter `Color` (HSL → RGB):
  - background `hsl(220 15% 8%)`, foreground `hsl(0 0% 98%)`
  - card `hsl(220 15% 12%)`, border `hsl(220 15% 20%)`
  - primary (energy orange) `hsl(24 100% 55%)`, primary-foreground white
  - accent (success green) `hsl(160 84% 45%)`
  - destructive `hsl(0 84% 60%)`, warning `hsl(45 100% 55%)`
  - muscle tokens: chest `hsl(0 80% 60%)`, back `hsl(210 80% 55%)`, shoulders `hsl(280 80% 60%)`, biceps `hsl(45 90% 55%)`, triceps `hsl(180 70% 50%)`, legs `hsl(140 70% 45%)`, abs `hsl(320 80% 55%)`
- Radius: 14 px (`0.875rem`). Glass-card look: semi-transparent card color + blur + 1px border at 30% opacity + soft shadow.
- Gradient primary: `LinearGradient(begin: topLeft, end: bottomRight, colors: [hsl(24,100,55), hsl(35,100,60)])`.
- Mobile-first: 390 px base, `SafeArea` everywhere, min touch target 44 px, respect notch + home indicator (`MediaQuery.padding`).
- Bottom navigation: **floating pill** style (5 tabs: Home, Workout, Nutrition, Social, Profile) with a center **Workout FAB**.
- Animated splash screen (~1.2 s) with the gradient logo, then route based on auth + role.

## 4. Authentication & role routing
- Email/password + Google OAuth (Supabase). Never use anonymous sign-in.
- After sign-in, query `user_roles` (table holds `app_role` enum: `admin | owner | trainer | member`) using the security-definer RPC `has_role(_user_id uuid, _role app_role) returns boolean`.
- Route guards mirror `MemberRoute` / `VerifiedMemberRoute` / `AdminRoute` from the handoff:
  - `owner` → `/owner`
  - `admin` → `/admin`
  - `trainer` → `/trainer`
  - `member` → `/` (member home)
  - Verified-only features (`attendance`, `membership`, `classes`, `pt-sessions`) require `gym_members.is_approved = true`; otherwise show a "Pending verification" gate screen.

## 5. Feature modules to build (each as its own folder under `lib/features/<name>/` with `data/`, `domain/`, `presentation/`)
Implement every module described in the handoff. Minimum set:
1. **Onboarding wizard** (5 steps; sets `profiles.onboarding_completed`)
2. **Dashboard / Home** (stories bar, streak card, AI suggestions, occupancy meter, announcements)
3. **Workout** (templates, active session, rest timer, supersets/circuits, PRs, history calendar, offline sync via Hive)
4. **AI Coach** + **Smart Workout Builder** + **Progressive Overload** (call edge functions `ai-coach`, `smart-workout-builder`)
5. **Exercise library** with AI-generated demos (`generate-exercise-demo` edge function, cache images)
6. **Nutrition** (food search, macros, water tracker, meal planner, AI food analyzer via `analyze-food` edge function — supports text + image)
7. **Progress** (measurements, progress photos with `analyze-progress-photo`, muscle heatmap SVG)
8. **Mobility routines** with interactive timer
9. **Attendance** (QR scan via `mobile_scanner` → `process-attendance` edge function, biometric simulator, points wallet, leaderboard, badges)
10. **Digital membership card** (gradient card + QR code via `qr_flutter`)
11. **Gamification** (XP, levels, badges, consistency tiers Bronze→Diamond, weekly challenges, group challenges, social duels, attendance rewards catalog)
12. **Social Hub** (Explorer feed, 24h stories with viewer counts, photo upload, comments sheet, follows, friend search by code, member discovery, follow suggestions)
13. **Real-time messaging** (WhatsApp-style chat: bubble grouping, blue double-tick read receipts, typing indicator, online dot, safe-area aware input, scroll-to-bottom on keyboard open). Use Supabase Realtime channels on `messages` table.
14. **Support tickets** (member → staff)
15. **Class booking** + **PT session booking**
16. **Membership / Stripe** (Basic / Pro / Elite via `create-checkout`, `customer-portal`, `check-subscription` edge functions; open Stripe checkout in `url_launcher` external browser tab)
17. **Gym announcements** (dismissible banners + paginated popups)
18. **Referral program** (friend codes for points)
19. **Marketplace** (`/market`)
20. **Owner dashboard** with all admin modules listed in the handoff (revenue, invoices, churn predictor, expense manager, plans, lead pipeline, promo campaigns, bulk notifier, surveys, CSV bulk member upload via `bulk-create-members` edge function, equipment tracker, attendance admin, dunning, trials pipeline, re-engagement, tax export, UPI payment links, branding settings, gym code, multi-branch rollup, daily QR generator, landing plans manager, notification queue, pending member approvals)
21. **Trainer dashboard** (assigned PT sessions, member activity)
22. **Admin dashboard** (super-admin role)
23. **Gym landing page** `/g/:gymCode` (public, shows plans + join CTA)
24. **WhatsApp click-to-chat** floating button on every member route, reads `organization_branding.whatsapp_number` and opens `https://wa.me/<number>?text=...` via `url_launcher`.
25. **UPI payment** deep link `upi://pay?pa=...&pn=...&am=...&tn=INV-xxx` via `url_launcher`, plus QR fallback.

## 6. Edge function clients
Generate a typed `lib/core/edge_functions.dart` with one method per Supabase Edge Function listed in the handoff (`ai-coach`, `analyze-food`, `analyze-progress-photo`, `bulk-create-members`, `check-subscription`, `create-checkout`, `customer-portal`, `generate-exercise-demo`, `process-attendance`, `smart-workout-builder`, `admin-create-user`). Use `supabase.functions.invoke()`. Type request/response with Freezed models matching the handoff contracts.

## 7. Realtime
- Subscribe to `messages`, `attendance_logs` (live occupancy), `notifications`, and `support_responses` via Supabase Realtime.
- Auto-resubscribe on app resume / network reconnect (`connectivity_plus`).

## 8. Offline & native
- Cache active workout in **Hive** so a session survives airplane mode; sync on reconnect (mirror `useOfflineWorkouts` behavior).
- **Push notifications** via Firebase Cloud Messaging; on token refresh, upsert into `profiles.push_token` (or equivalent table referenced in handoff). Handle foreground + background + terminated states.
- **Hardware back button** (Android): intercept globally — pop route if possible, else minimize app (use `move_to_background` package or platform channel). Mirror `BackButtonHandler.tsx`.
- **Camera + image picker** for progress photos, food analyzer, avatar upload. Upload to Supabase Storage respecting the `{userId}/` path prefix RLS constraint for community buckets (`avatars`, `progress-photos`, `community-photos`, `stories`).
- **Capacitor parity not needed** — this is native Flutter.

## 9. Security rules (do not violate)
- Never store roles in `profiles`. Always read from `user_roles` via `has_role` RPC.
- Always pass JWT to edge functions (supabase_flutter does this automatically when user is signed in).
- Storage uploads: prefix every key with `${supabase.auth.currentUser!.id}/` or the upload will be rejected by RLS.
- Never use anonymous sign-ups.

## 10. Folder structure
```
lib/
  main.dart
  app.dart                  // MaterialApp.router + theme
  core/
    env.dart
    theme/ (colors, typography, glass_card.dart, gradients.dart)
    router/ (app_router.dart, guards.dart)
    supabase/ (client.dart, realtime.dart)
    edge_functions.dart
    storage/ (hive_boxes.dart, secure_storage.dart)
    push/ (fcm_service.dart)
    widgets/ (glass_card, bottom_nav, splash, whatsapp_fab, pending_gate)
  features/
    auth/ ...
    onboarding/ ...
    home/ ...
    workout/ ...
    nutrition/ ...
    progress/ ...
    mobility/ ...
    attendance/ ...
    membership_card/ ...
    gamification/ ...
    social/ ...
    messaging/ ...
    classes/ ...
    pt_sessions/ ...
    membership_billing/ ...
    announcements/ ...
    referrals/ ...
    marketplace/ ...
    owner/ ...
    trainer/ ...
    admin/ ...
    support/ ...
    gym_landing/ ...
```

## 11. Quality bar
- Strong typing via Freezed + json_serializable for every Supabase row referenced in the handoff schema (72 tables — generate models on demand per feature, not all at once).
- Every screen has loading, empty, and error states.
- Every list uses skeleton shimmer while loading.
- Animations: subtle, native-feeling, 200–300 ms `Curves.easeOutCubic`. Use `Hero` for avatar → profile transitions.
- Accessibility: semantic labels, min contrast AA, scalable text.
- Lint clean (`flutter analyze` passes with zero issues), formatted (`dart format`).
- Write at least smoke widget tests for every top-level route.

## 12. Deliverables (incremental commits)
1. Project scaffold + theme + router + Supabase client + auth + role guards.
2. Onboarding + Home + Profile.
3. Workout + AI Coach + Exercise library (with offline cache).
4. Nutrition + Food analyzer + Water + Meal planner.
5. Progress + Measurements + Muscle heatmap + Mobility.
6. Attendance + Membership card + QR scan + Gamification + Rewards.
7. Social Hub + Stories + Messaging (realtime) + Friends + Follows + Support.
8. Classes + PT sessions + Membership billing (Stripe).
9. Owner dashboard (all modules).
10. Trainer + Admin dashboards + Gym landing + Marketplace + final polish.

Begin with deliverable 1. After each deliverable, run `flutter analyze` and `flutter test`, then summarize what shipped and what's next. Do **not** ask clarifying questions for anything already answered in `FLUTTER_HANDOFF_SCOPE_OF_WORK.md` — read it first.

--- PROMPT END ---

## How to use
1. In Antigravity, create a new workspace and select **Flutter** as the project type.
2. Upload `FLUTTER_HANDOFF_SCOPE_OF_WORK.md` as an attachment to the task.
3. Paste the prompt above as the initial instruction.
4. Let Antigravity execute deliverable-by-deliverable; review each commit before approving the next.
