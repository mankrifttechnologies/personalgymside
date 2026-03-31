import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAdminAnalytics } from '@/hooks/useAnalytics';
import { useOwnerAnalytics } from '@/hooks/useOwnerAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Users, CheckCircle2, Clock, Dumbbell, MessageSquare, AlertTriangle,
  Loader2, TrendingUp, Activity, Send, Bell, BarChart3, Percent
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  LineChart, Line, CartesianGrid, Cell
} from 'recharts';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_LABELS = ['6a', '7a', '8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p'];
const HOUR_RANGE = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export default function OwnerAnalyticsDashboard() {
  const { user } = useAuth();
  const analytics = useAdminAnalytics();
  const owner = useOwnerAnalytics();
  const [sendingAlerts, setSendingAlerts] = useState<Set<string>>(new Set());

  if (analytics.isLoading || owner.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    { label: 'Total Members', value: analytics.totalMembers, icon: Users, color: 'text-blue-400' },
    { label: 'Approved', value: analytics.approvedMembers, icon: CheckCircle2, color: 'text-green-400' },
    { label: 'Pending', value: analytics.pendingMembers, icon: Clock, color: 'text-yellow-400' },
    { label: 'Active Classes', value: analytics.activeClasses, icon: Dumbbell, color: 'text-primary' },
    { label: 'Open Tickets', value: analytics.openTickets, icon: MessageSquare, color: 'text-red-400' },
    { label: 'Inactive (7d)', value: analytics.inactiveMembers.length, icon: AlertTriangle, color: 'text-orange-400' },
  ];

  // Peak hours heatmap data
  const heatmapMax = Math.max(1, ...owner.peakHours.flat());

  const getHeatColor = (value: number) => {
    if (value === 0) return 'bg-muted/30';
    const intensity = value / heatmapMax;
    if (intensity < 0.25) return 'bg-primary/20';
    if (intensity < 0.5) return 'bg-primary/40';
    if (intensity < 0.75) return 'bg-primary/60';
    return 'bg-primary/90';
  };

  const handleSendAlert = async (memberId: string, memberName: string) => {
    if (!user) return;
    setSendingAlerts(prev => new Set(prev).add(memberId));

    try {
      // Send a message to the inactive member
      await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: memberId,
        content: `Hey ${memberName}! 👋 We noticed you haven't visited the gym in a while. We miss you! Come back and crush your goals. 💪🔥`,
      });

      toast.success(`Re-engagement message sent to ${memberName}`);
    } catch (error) {
      toast.error('Failed to send alert');
    } finally {
      setSendingAlerts(prev => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    }
  };

  const handleSendAllAlerts = async () => {
    if (!user) return;
    const inactive = analytics.inactiveMembers;
    if (inactive.length === 0) return;

    setSendingAlerts(new Set(inactive.map(m => m.user_id)));

    try {
      const messages = inactive.map(m => ({
        sender_id: user.id,
        receiver_id: m.user_id,
        content: `Hey ${m.name}! 👋 We noticed you haven't visited the gym in a while. We miss you! Come back and crush your goals. 💪🔥`,
      }));

      await supabase.from('messages').insert(messages);
      toast.success(`Re-engagement messages sent to ${inactive.length} members`);
    } catch (error) {
      toast.error('Failed to send alerts');
    } finally {
      setSendingAlerts(new Set());
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="glass-card">
            <CardContent className="p-3 flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.color} shrink-0`} />
              <div className="min-w-0">
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground truncate">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Member Growth / Revenue Proxy */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Member Growth (6 Months)
          </CardTitle>
          <div className="flex gap-3 mt-1">
            <Badge variant="outline" className="text-[10px]">
              Active: {owner.revenue.totalActiveMembers}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              Total: {owner.revenue.totalMembers}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={owner.revenue.monthlyGrowth}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: 'none', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="newMembers" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="New Members" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Member Retention */}
      {owner.retention.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Percent className="w-4 h-4 text-green-400" />
              Member Retention Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={owner.retention}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="%" />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: 'none', borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number) => [`${value}%`, 'Retention']}
                  />
                  <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
              {owner.retention.slice(-1).map(r => (
                <div key={r.month}>
                  <span className="font-medium text-foreground">{r.month}:</span> {r.retained} retained, {r.churned} churned
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Peak Hours Heatmap */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-400" />
            Peak Hours Heatmap (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              {/* Hour labels */}
              <div className="flex ml-10 mb-1">
                {HOUR_LABELS.map(h => (
                  <div key={h} className="flex-1 text-[8px] text-muted-foreground text-center">{h}</div>
                ))}
              </div>
              {/* Grid */}
              {DAY_LABELS.map((day, dayIdx) => (
                <div key={day} className="flex items-center gap-1 mb-0.5">
                  <span className="text-[10px] text-muted-foreground w-9 text-right">{day}</span>
                  <div className="flex flex-1 gap-0.5">
                    {HOUR_RANGE.map(hour => (
                      <div
                        key={hour}
                        className={`flex-1 h-5 rounded-sm ${getHeatColor(owner.peakHours[dayIdx]?.[hour] || 0)} transition-colors`}
                        title={`${day} ${hour}:00 — ${owner.peakHours[dayIdx]?.[hour] || 0} check-ins`}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center justify-end gap-1 mt-2">
                <span className="text-[9px] text-muted-foreground">Less</span>
                {['bg-muted/30', 'bg-primary/20', 'bg-primary/40', 'bg-primary/60', 'bg-primary/90'].map(c => (
                  <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
                ))}
                <span className="text-[9px] text-muted-foreground">More</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class Fill Rates */}
      {owner.classFillRates.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Class Fill Rates (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {owner.classFillRates.map(cls => (
              <div key={cls.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{cls.title}</p>
                  <p className="text-[10px] text-muted-foreground">{cls.totalBookings} bookings / {cls.capacity * 4} capacity</p>
                </div>
                <div className="w-24 sm:w-32">
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${cls.fillRate}%`,
                        background: cls.fillRate > 75 ? 'hsl(var(--primary))' : cls.fillRate > 40 ? 'hsl(var(--chart-4))' : 'hsl(var(--destructive))',
                      }}
                    />
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] w-12 justify-center">
                  {Math.round(cls.fillRate)}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Monthly Check-ins */}
      {analytics.monthlyAttendance.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Monthly Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlyAttendance}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: 'none', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inactive Members Alert with Re-engagement */}
      {analytics.inactiveMembers.length > 0 && (
        <Card className="glass-card border-orange-500/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Inactive Members (7+ days)
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="text-[10px] h-7 gap-1 border-orange-400/30 text-orange-400 hover:bg-orange-400/10"
                onClick={handleSendAllAlerts}
                disabled={sendingAlerts.size > 0}
              >
                {sendingAlerts.size > 0 ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Bell className="w-3 h-3" />
                )}
                Alert All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.inactiveMembers.slice(0, 15).map((member) => (
              <div key={member.user_id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={member.avatar_url || ''} />
                  <AvatarFallback className="text-xs">{member.name?.[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm truncate flex-1">{member.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                  onClick={() => handleSendAlert(member.user_id, member.name)}
                  disabled={sendingAlerts.has(member.user_id)}
                >
                  {sendingAlerts.has(member.user_id) ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </Button>
                <Badge variant="outline" className="text-[10px] text-orange-400 border-orange-400/30">Inactive</Badge>
              </div>
            ))}
            {analytics.inactiveMembers.length > 15 && (
              <p className="text-xs text-muted-foreground text-center">
                +{analytics.inactiveMembers.length - 15} more
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
