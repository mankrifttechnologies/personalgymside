import { useState } from 'react';
import { useGrowthStats } from '@/hooks/useGrowth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, UserPlus, Users, TrendingUp, CalendarCheck, Target, Megaphone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import LeadTracker from './LeadTracker';
import CampaignManager from './CampaignManager';

export default function GrowthDashboard() {
  const { stats, isLoading } = useGrowthStats();
  const [subTab, setSubTab] = useState('overview');

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const sourceData = Object.entries(stats.sourceBreakdown).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-4">
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="grid w-full grid-cols-3 h-9">
          <TabsTrigger value="overview" className="text-[10px] sm:text-xs px-1">Overview</TabsTrigger>
          <TabsTrigger value="leads" className="text-[10px] sm:text-xs px-1">Leads</TabsTrigger>
          <TabsTrigger value="campaigns" className="text-[10px] sm:text-xs px-1">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Leads</p>
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <span className="text-lg font-bold mt-1 block">{stats.totalLeads}</span>
                <p className="text-[10px] text-muted-foreground">{stats.monthlyLeads} this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Conversion</p>
                  <Target className="w-3.5 h-3.5 text-green-500" />
                </div>
                <span className="text-lg font-bold mt-1 block">{stats.conversionRate}%</span>
                <p className="text-[10px] text-muted-foreground">{stats.convertedLeads} converted</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Follow-ups</p>
                  <CalendarCheck className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-lg font-bold mt-1 block">{stats.followUpsToday}</span>
                <p className="text-[10px] text-muted-foreground">Scheduled today</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Campaigns</p>
                  <Megaphone className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-lg font-bold mt-1 block">{stats.activeCampaigns}</span>
                <p className="text-[10px] text-muted-foreground">Active now</p>
              </CardContent>
            </Card>
          </div>

          {/* Lead Pipeline */}
          <Card>
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-sm">Lead Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="space-y-2">
                {[
                  { label: 'New', count: stats.newLeads, color: 'bg-blue-500' },
                  { label: 'Contacted', count: stats.contactedLeads, color: 'bg-yellow-500' },
                  { label: 'Converted', count: stats.convertedLeads, color: 'bg-green-500' },
                  { label: 'Lost', count: stats.lostLeads, color: 'bg-red-500' },
                ].map(stage => {
                  const pct = stats.totalLeads > 0 ? (stage.count / stats.totalLeads) * 100 : 0;
                  return (
                    <div key={stage.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{stage.label}</span>
                        <span className="font-medium">{stage.count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${stage.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Lead Trend Chart */}
          <Card>
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-sm">Lead Trend (6 months)</CardTitle>
            </CardHeader>
            <CardContent className="px-1 pb-3">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="New Leads" />
                    <Bar dataKey="converted" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="Converted" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Lead Sources */}
          {sourceData.length > 0 && (
            <Card>
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm">Lead Sources</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="space-y-2">
                  {sourceData.map(item => {
                    const total = sourceData.reduce((s, c) => s + c.value, 0);
                    const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
                    return (
                      <div key={item.name} className="flex items-center justify-between">
                        <span className="text-xs capitalize">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{item.value}</span>
                          <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="leads" className="mt-4">
          <LeadTracker />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          <CampaignManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
