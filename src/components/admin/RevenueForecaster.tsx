import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRevenueForecast } from '@/hooks/useAdvancedAnalytics';
import { TrendingUp, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format, parse } from 'date-fns';

export default function RevenueForecaster() {
  const { data, isLoading } = useRevenueForecast();

  if (isLoading || !data) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.chartData.map(d => ({
    ...d,
    label: (() => {
      try { return format(parse(d.month, 'yyyy-MM', new Date()), 'MMM yy'); }
      catch { return d.month; }
    })(),
  }));

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Revenue Forecast
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-[10px] text-muted-foreground">Avg Monthly</p>
            <p className="text-sm font-bold">₹{data.avgMonthly.toLocaleString()}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-[10px] text-muted-foreground">Trend</p>
            <p className="text-sm font-bold flex items-center justify-center gap-1">
              {data.trend >= 0 ? <ArrowUpRight className="w-3 h-3 text-green-500" /> : <ArrowDownRight className="w-3 h-3 text-destructive" />}
              {Math.abs(data.trend)}%
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-[10px] text-muted-foreground">Active</p>
            <p className="text-sm font-bold">{data.activeMembers}</p>
          </div>
        </div>

        {chartData.length > 0 && (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(val: number) => [`₹${val?.toLocaleString() || 0}`, '']}
                  labelFormatter={l => l}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Area type="monotone" dataKey="actual" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="Actual" />
                <Area type="monotone" dataKey="projected" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeDasharray="5 5" name="Projected" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
