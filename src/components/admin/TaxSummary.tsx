import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTaxSummary } from '@/hooks/useAnalyticsReports';
import { Loader2, IndianRupee, TrendingUp, TrendingDown, Receipt } from 'lucide-react';

type Period = 'monthly' | 'quarterly' | 'yearly';

export default function TaxSummary() {
  const [period, setPeriod] = useState<Period>('monthly');
  const { data, isLoading } = useTaxSummary(period);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const periodLabels: Record<Period, string> = { monthly: 'This Month', quarterly: 'This Quarter', yearly: 'This Year' };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            Tax Summary
          </CardTitle>
          <div className="flex gap-1">
            {(['monthly', 'quarterly', 'yearly'] as Period[]).map(p => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? 'default' : 'ghost'}
                className="h-6 text-[10px] px-2"
                onClick={() => setPeriod(p)}
              >
                {p === 'monthly' ? 'M' : p === 'quarterly' ? 'Q' : 'Y'}
              </Button>
            ))}
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] w-fit">{periodLabels[period]}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              <span className="text-[10px] text-muted-foreground">Revenue</span>
            </div>
            <p className="text-base font-bold text-green-500 flex items-center">
              <IndianRupee className="w-3.5 h-3.5" />
              {data.totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              <span className="text-[10px] text-muted-foreground">Expenses</span>
            </div>
            <p className="text-base font-bold text-red-500 flex items-center">
              <IndianRupee className="w-3.5 h-3.5" />
              {data.totalExpenses.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-1.5 mb-1">
            <IndianRupee className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground">Net Profit</span>
          </div>
          <p className={`text-lg font-bold flex items-center ${data.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            <IndianRupee className="w-4 h-4" />
            {Math.abs(data.netProfit).toLocaleString()}
            {data.netProfit < 0 && <span className="text-xs ml-1">(Loss)</span>}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-1.5 mb-1">
            <Receipt className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-[10px] text-muted-foreground">Estimated GST (18%)</span>
          </div>
          <p className="text-base font-bold text-yellow-500 flex items-center">
            <IndianRupee className="w-3.5 h-3.5" />
            {data.gst18.toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
