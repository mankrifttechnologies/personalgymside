

# FitAI Coach — Client Demo Pitch Deck

## What We're Building
A new `/demo` route with a fullscreen, interactive slide presentation showcasing the FitAI Coach platform to your client. Professional, polished, keyboard-navigable.

## Slide Outline (10 slides)

1. **Title Slide** — "FitAI Coach" logo, tagline "The Complete Gym Management Platform", your branding
2. **The Problem** — Gyms juggle 10+ tools for members, payments, classes, communication
3. **The Solution** — One unified platform for members AND gym owners
4. **Member Features** — AI workouts, nutrition tracking, workout logging, streaks, badges, duels
5. **Social & Engagement** — Stories, friends, leaderboards, group challenges, messaging
6. **Gym Owner Dashboard** — Analytics, revenue tracking, attendance, class management
7. **Advanced Analytics** — Churn prediction, revenue forecasting, member segmentation, custom reports
8. **Communication Hub** — Bulk notifications, payment reminders, feedback collection, announcements
9. **Additional Features** — Membership plans, PT sessions, exercise library, mobility routines, rewards
10. **Contact / CTA** — "Ready to transform your gym?" with key highlights recap

## Technical Approach

### New Files
- `src/pages/Demo.tsx` — Main presentation page with slide navigation
- `src/components/demo/SlideRenderer.tsx` — Scaled 16:9 slide container
- `src/components/demo/slides.tsx` — All 10 slide content components

### Features
- Fixed 1920x1080 resolution, scaled to fit viewport
- Keyboard navigation (Arrow keys, Space, Escape)
- Slide counter and progress bar
- Fullscreen mode button
- Smooth transitions between slides
- Dark premium theme with accent colors matching the app
- Icons from lucide-react for visual richness

### Integration
- Add `/demo` route to `App.tsx`
- No auth required — publicly accessible for client viewing

### Design
- Dark gradient backgrounds (navy/charcoal)
- Primary accent from the app's theme
- Large typography, icon grids, feature cards
- Subtle fade/slide animations between slides

