import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemberDemographics, usePlanDistribution } from '@/hooks/useAnalyticsReports';
import { Loader2, Users, Target, Calendar, Award } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--destructive))',
];

export default function MemberDemographics() {
  const { data: demo, isLoading } = useMemberDemographics();
  const { data: planDist } = usePlanDistribution();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!demo) return null;

  return (
    <div className="space-y-4">
      {/* Gender Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Gender Split
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={demo.gender} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
                    {demo.gender.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: 'none', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {demo.gender.map((g, i) => (
                <div key={g.name} className="flex items-center gap-1 text-[10px]">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{g.name}: {g.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Age Distribution */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-chart-2" />
              Age Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demo.age} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={40} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: 'none', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fitness Goals */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-chart-3" />
            Fitness Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demo.goals}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" angle={-20} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: 'none', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Plan Distribution */}
      {planDist && planDist.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-chart-4" />
              Membership Plan Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {planDist.map((plan, i) => (
                <div key={plan.name} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-sm flex-1 truncate">{plan.name}</span>
                  <span className="text-xs text-muted-foreground">{plan.count} members</span>
                  <span className="text-xs font-medium">₹{plan.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tier Distribution */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-chart-5" />
            Member Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={demo.tiers} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} innerRadius={25}>
                  {demo.tiers.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: 'none', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {demo.tiers.map((t, i) => (
              <div key={t.name} className="flex items-center gap-1 text-[10px]">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground capitalize">{t.name}: {t.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
