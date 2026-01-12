import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CalendarCheck, 
  Flame, 
  Trophy, 
  Clock, 
  TrendingUp,
  Target
} from 'lucide-react';
import { useGymMember, useMemberStreak, useAttendanceStats } from '@/hooks/useAttendance';
import { useMyRank } from '@/hooks/useLeaderboard';
import { format } from 'date-fns';

export function AttendanceCard() {
  const { data: member } = useGymMember();
  const { data: streak } = useMemberStreak(member?.id);
  const stats = useAttendanceStats(member?.id);
  const myRank = useMyRank(member?.id, 'streak');

  if (!member) return null;

  const monthlyGoal = 20; // Days per month goal
  const monthlyProgress = stats ? Math.min((stats.thisMonth / monthlyGoal) * 100, 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            My Attendance
          </CardTitle>
          <Badge variant="outline" className="font-mono">
            {member.member_code}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Streak Display */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-500/20">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{streak?.current_streak || 0}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Best</p>
            <p className="font-semibold">{streak?.longest_streak || 0} days</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Trophy className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
            <p className="text-lg font-bold">#{myRank || '-'}</p>
            <p className="text-xs text-muted-foreground">Rank</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-lg font-bold">{stats?.thisWeek || 0}</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold">{stats?.onTimePercentage || 0}%</p>
            <p className="text-xs text-muted-foreground">On Time</p>
          </div>
        </div>

        {/* Monthly Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              Monthly Goal
            </span>
            <span className="font-medium">{stats?.thisMonth || 0}/{monthlyGoal} days</span>
          </div>
          <Progress value={monthlyProgress} className="h-2" />
        </div>

        {/* Last Check-in */}
        {streak?.last_attendance_date && (
          <div className="text-sm text-muted-foreground text-center pt-2 border-t">
            Last attendance: {format(new Date(streak.last_attendance_date), 'MMM d, yyyy')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
