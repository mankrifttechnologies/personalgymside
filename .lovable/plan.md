## Advanced Analytics Module

### Components to Build

1. **Churn Predictor** (`src/components/admin/ChurnPredictor.tsx`)
   - Identify at-risk members based on attendance drop-off, payment gaps, and inactivity
   - Risk scoring (high/medium/low) with visual indicators
   - One-tap action to send re-engagement message

2. **Revenue Forecaster** (`src/components/admin/RevenueForecaster.tsx`)
   - Project next 3 months revenue based on active memberships and renewal patterns
   - Visual chart showing projected vs actual revenue
   - Factor in upcoming plan expirations

3. **Member Segmentation** (`src/components/admin/MemberSegmentation.tsx`)
   - Auto-segment members by activity level, tier, goal, and tenure
   - Visual breakdown with pie/bar charts
   - Drill-down into each segment

4. **Custom Report Builder** (`src/components/admin/CustomReportBuilder.tsx`)
   - Pick data source (members, payments, attendance, workouts)
   - Select date range and filters
   - Generate and download CSV reports

### Integration
- Add "Insights" tab to Admin Dashboard
- All data queries use existing tables (no new tables needed)
- Uses `recharts` for visualizations
