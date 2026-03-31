import { useState } from 'react';
import { useRevenueStats } from '@/hooks/useRevenue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp, TrendingDown, IndianRupee, AlertTriangle, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import MembershipPlansManager from './MembershipPlansManager';
import PaymentTracker from './PaymentTracker';
import ExpenseManager from './ExpenseManager';

const COLORS = ['hsl(var(--primary))', '#f97316', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f59e0b', '#6366f1', '#14b8a6'];

export default function RevenueDashboard() {
  const { stats, isLoading } = useRevenueStats();
  const [subTab, setSubTab] = useState('overview');

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const categoryData = Object.entries(stats.expenseByCategory).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-4">
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="grid w-full grid-cols-4 h-9">
          <TabsTrigger value="overview" className="text-[10px] sm:text-xs px-1">Overview</TabsTrigger>
          <TabsTrigger value="plans" className="text-[10px] sm:text-xs px-1">Plans</TabsTrigger>
          <TabsTrigger value="payments" className="text-[10px] sm:text-xs px-1">Payments</TabsTrigger>
          <TabsTrigger value="expenses" className="text-[10px] sm:text-xs px-1">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Revenue</p>
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                </div>
                <div className="flex items-center gap-0.5 mt-1">
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span className="text-lg font-bold">{stats.monthlyRevenue.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Expenses</p>
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                </div>
                <div className="flex items-center gap-0.5 mt-1">
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span className="text-lg font-bold">{stats.monthlyExpenses.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card className={stats.monthlyProfit >= 0 ? 'border-green-500/30' : 'border-red-500/30'}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Profit</p>
                  {stats.monthlyProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-green-500" /> : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                </div>
                <div className="flex items-center gap-0.5 mt-1">
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span className={`text-lg font-bold ${stats.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(stats.monthlyProfit).toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card className={stats.overdueCount > 0 ? 'border-destructive/50' : ''}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Overdue</p>
                  <AlertTriangle className={`w-3.5 h-3.5 ${stats.overdueCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                </div>
                <span className={`text-lg font-bold ${stats.overdueCount > 0 ? 'text-destructive' : ''}`}>
                  {stats.overdueCount}
                </span>
                <p className="text-[10px] text-muted-foreground">Pending payments</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue vs Expenses Chart */}
          <Card>
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-sm">Revenue vs Expenses (6 months)</CardTitle>
            </CardHeader>
            <CardContent className="px-1 pb-3">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
                    <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Profit Trend */}
          <Card>
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-sm">Profit Trend</CardTitle>
            </CardHeader>
            <CardContent className="px-1 pb-3">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          {categoryData.length > 0 && (
            <Card>
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <PieChart className="w-4 h-4" /> Expense Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="space-y-2">
                  {categoryData.sort((a, b) => b.value - a.value).map((item, i) => {
                    const total = categoryData.reduce((s, c) => s + c.value, 0);
                    const pct = total > 0 ? (item.value / total * 100).toFixed(0) : '0';
                    return (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-xs flex-1 capitalize">{item.name}</span>
                        <span className="text-xs font-medium">₹{item.value.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="plans" className="mt-4">
          <MembershipPlansManager />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <PaymentTracker />
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <ExpenseManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
