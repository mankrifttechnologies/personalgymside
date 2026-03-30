import { useGymMember, useAttendanceLogs } from '@/hooks/useAttendance';
import { CalendarCheck, Clock, TrendingUp, Zap } from 'lucide-react';

export default function CheckInStatsWidget() {
  const { data: member } = useGymMember();
  const { data: logs } = useAttendanceLogs(member?.id || '');

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const weekCount = (logs || []).filter(l => new Date(l.check_in_time) >= startOfWeek).length;
  const monthCount = (logs || []).filter(l => new Date(l.check_in_time) >= startOfMonth).length;
  const totalCount = (logs || []).length;
  
  const avgDuration = (logs || []).reduce((sum, l) => sum + (l.duration_minutes || 0), 0) / Math.max(totalCount, 1);

  if (!member) return null;

  const stats = [
    { icon: Zap, label: 'This Week', value: weekCount, color: 'text-primary', bg: 'bg-primary/10' },
    { icon: CalendarCheck, label: 'This Month', value: monthCount, color: 'text-accent', bg: 'bg-accent/10' },
    { icon: TrendingUp, label: 'Total', value: totalCount, color: 'text-warning', bg: 'bg-warning/10' },
    { icon: Clock, label: 'Avg Min', value: Math.round(avgDuration), color: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
    <div className="glass-card p-5 animate-slide-up">
      <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
        <CalendarCheck className="w-5 h-5 text-accent" />
        Gym Check-ins
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`text-center p-3 rounded-xl ${s.bg}`}>
              <Icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
              <p className="text-xl font-extrabold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
