import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReportData } from '@/hooks/useAnalyticsReports';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, Users, IndianRupee, Loader2, ClipboardList, Dumbbell } from 'lucide-react';

const reports = [
  { id: 'members', label: 'Member List', icon: Users, desc: 'All members with demographics & status', file: 'members_report.csv' },
  { id: 'revenue', label: 'Revenue Report', icon: IndianRupee, desc: 'All payments with invoice details', file: 'revenue_report.csv' },
  { id: 'expenses', label: 'Expense Report', icon: ClipboardList, desc: 'All expenses by category', file: 'expense_report.csv' },
  { id: 'attendance', label: 'Attendance Log', icon: Dumbbell, desc: 'Last 500 check-in/check-out records', file: 'attendance_report.csv' },
] as const;

type ReportId = typeof reports[number]['id'];

export default function ReportGenerator() {
  const { generateMemberReport, generateRevenueReport, generateExpenseReport, generateAttendanceReport, downloadCSV } = useReportData();
  const [loading, setLoading] = useState<ReportId | null>(null);

  const handleDownload = async (id: ReportId) => {
    setLoading(id);
    try {
      let csv = '';
      const report = reports.find(r => r.id === id)!;

      switch (id) {
        case 'members': csv = await generateMemberReport(); break;
        case 'revenue': csv = await generateRevenueReport(); break;
        case 'expenses': csv = await generateExpenseReport(); break;
        case 'attendance': csv = await generateAttendanceReport(); break;
      }

      if (!csv) {
        toast.error('No data found for this report');
        return;
      }

      downloadCSV(csv, report.file);
      toast.success(`${report.label} downloaded!`);
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-primary" />
          Download Reports (CSV)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {reports.map(r => (
          <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <r.icon className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{r.label}</p>
              <p className="text-[10px] text-muted-foreground">{r.desc}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-[10px]"
              onClick={() => handleDownload(r.id)}
              disabled={loading === r.id}
            >
              {loading === r.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Download className="w-3 h-3" />
              )}
              CSV
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
