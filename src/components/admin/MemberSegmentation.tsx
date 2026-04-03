import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMemberSegmentation } from '@/hooks/useAdvancedAnalytics';
import { PieChart as PieIcon, Loader2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.7)',
  'hsl(var(--primary) / 0.5)',
  'hsl(var(--primary) / 0.3)',
  'hsl(var(--muted-foreground) / 0.5)',
  'hsl(var(--muted-foreground) / 0.3)',
];

export default function MemberSegmentation() {
  const { data, isLoading } = useMemberSegmentation();
  const [view, setView] = useState('tier');

  if (isLoading || !data) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const datasets: Record<string, { name: string; value: number }[]> = {
    tier: data.byTier,
    goal: data.byGoal,
    gender: data.byGender,
    age: data.byAge,
  };

  const current = datasets[view] || [];

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-primary" />
          Member Segments ({data.total})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Tabs value={view} onValueChange={setView}>
          <TabsList className="grid grid-cols-4 h-8">
            <TabsTrigger value="tier" className="text-[10px]">Tier</TabsTrigger>
            <TabsTrigger value="goal" className="text-[10px]">Goal</TabsTrigger>
            <TabsTrigger value="gender" className="text-[10px]">Gender</TabsTrigger>
            <TabsTrigger value="age" className="text-[10px]">Age</TabsTrigger>
          </TabsList>
        </Tabs>

        {current.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data</p>
        ) : view === 'age' ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={current}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="h-40 w-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={current} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                    {current.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              {current.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="truncate">{item.name}</span>
                  <span className="ml-auto font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
