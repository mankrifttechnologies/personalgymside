import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAdminAnalytics } from '@/hooks/useAnalytics';
import { Users, CheckCircle2, Clock, Dumbbell, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function AnalyticsTab() {
  const analytics = useAdminAnalytics();

  if (analytics.isLoading) {
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

      {/* Attendance Chart */}
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

      {/* Inactive Members Alert */}
      {analytics.inactiveMembers.length > 0 && (
        <Card className="glass-card border-orange-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Inactive Members (7+ days)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.inactiveMembers.slice(0, 10).map((member) => (
              <div key={member.user_id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={member.avatar_url || ''} />
                  <AvatarFallback className="text-xs">{member.name?.[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm truncate flex-1">{member.name}</span>
                <Badge variant="outline" className="text-[10px] text-orange-400 border-orange-400/30">Inactive</Badge>
              </div>
            ))}
            {analytics.inactiveMembers.length > 10 && (
              <p className="text-xs text-muted-foreground text-center">
                +{analytics.inactiveMembers.length - 10} more
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
