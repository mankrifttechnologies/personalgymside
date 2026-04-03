import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomReport } from '@/hooks/useAdvancedAnalytics';
import { FileDown, Loader2, Table } from 'lucide-react';
import { format, subDays } from 'date-fns';

export default function CustomReportBuilder() {
  const { generateReport } = useCustomReport();
  const [source, setSource] = useState('members');
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ data: any[]; columns: string[] } | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateReport(source, dateFrom, dateTo);
      setPreview(result);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!preview) return;
    const { data, columns } = preview;
    const csv = [columns.join(','), ...data.map(row => columns.map(c => {
      const val = row[c];
      return typeof val === 'string' && val.includes(',') ? `"${val}"` : val ?? '';
    }).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${source}_report_${dateFrom}_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Table className="w-4 h-4 text-primary" />
          Custom Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="members">Members</SelectItem>
              <SelectItem value="payments">Payments</SelectItem>
              <SelectItem value="attendance">Attendance</SelectItem>
              <SelectItem value="workouts">Workouts</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs" />
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs" />
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={handleGenerate} disabled={loading} className="flex-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Table className="w-4 h-4 mr-1" />}
            Generate
          </Button>
          {preview && preview.data.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <FileDown className="w-4 h-4 mr-1" />
              CSV
            </Button>
          )}
        </div>

        {preview && (
          <div className="text-xs">
            <p className="text-muted-foreground mb-2">{preview.data.length} rows found</p>
            {preview.data.length > 0 && (
              <div className="overflow-x-auto rounded-lg border max-h-48">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-muted/50">
                      {preview.columns.map(c => (
                        <th key={c} className="px-2 py-1 text-left font-medium whitespace-nowrap">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.data.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-t">
                        {preview.columns.map(c => (
                          <td key={c} className="px-2 py-1 whitespace-nowrap max-w-[120px] truncate">{String(row[c] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
