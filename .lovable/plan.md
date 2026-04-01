## Analytics & Reports Module

### Scope
Build comprehensive analytics and reporting tools for gym owners — all data aggregated from existing tables (no new DB tables needed).

### Components to Build

1. **Enhanced Analytics Tab** (`src/components/admin/AnalyticsTab.tsx` - already exists, will enhance)
   - Member demographics (age, gender, fitness goal distribution)
   - Membership plan distribution pie chart
   - New vs returning members trend
   - Active vs inactive member ratio

2. **Attendance Heatmap** (`src/components/admin/AttendanceHeatmap.tsx`)
   - 7-day × 24-hour grid showing peak gym hours
   - Color-coded intensity based on check-in frequency
   - Mobile-friendly scrollable view

3. **Report Generator** (`src/components/admin/ReportGenerator.tsx`)
   - One-tap downloadable CSV reports:
     - Revenue summary (monthly breakdown)
     - Member list with status & plan
     - Attendance summary
     - Expense report
   - Date range picker for filtering

4. **Tax Summary Card** (`src/components/admin/TaxSummary.tsx`)
   - Total revenue, total expenses, net profit
   - GST estimation (configurable %)
   - Monthly/quarterly/yearly toggle
   - Export-ready format

### Hook
- `src/hooks/useAnalyticsReports.tsx` — aggregation queries for demographics, attendance patterns, and report data generation

### Integration
- Replace current basic AnalyticsTab content or add as sub-tabs within the existing Analytics tab
