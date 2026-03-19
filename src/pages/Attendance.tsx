import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  useGymMember, 
  useAttendanceLogs, 
  useMemberStreak, 
  usePointsWallet,
  useCreateGymMember,
  useAttendanceStats
} from '@/hooks/useAttendance';
import { useRealtimeAttendance } from '@/hooks/useRealtimeAttendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';
import { BiometricSimulator } from '@/components/attendance/BiometricSimulator';
import { AttendanceCard } from '@/components/attendance/AttendanceCard';
import { PointsWalletCard } from '@/components/attendance/PointsWalletCard';
import { MemberBadgesCard } from '@/components/attendance/MemberBadgesCard';
import { AttendanceHistory } from '@/components/attendance/AttendanceHistory';
import {
  ChevronLeft, 
  Fingerprint, 
  Flame, 
  Calendar, 
  TrendingUp,
  Wallet,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

export default function Attendance() {
  const { user, loading: authLoading } = useAuth();
  const { data: gymMember, isLoading: memberLoading } = useGymMember();
  const { data: logs } = useAttendanceLogs(gymMember?.id);
  const { data: streak } = useMemberStreak(gymMember?.id);
  const { data: wallet } = usePointsWallet(gymMember?.id);
  const createMember = useCreateGymMember();
  const stats = useAttendanceStats(gymMember?.id);
  const [activeTab, setActiveTab] = useState('overview');

  // Enable realtime updates
  useRealtimeAttendance();

  if (authLoading || memberLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user has gym membership
  if (!gymMember) {
    return (
      <div className="min-h-screen pb-24 safe-area-top">
        <header className="p-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Attendance</h1>
        </header>

        <main className="px-4">
          <Card className="text-center py-8">
            <CardHeader>
              <div className="mx-auto p-4 rounded-full bg-primary/20 w-fit mb-4">
                <Fingerprint className="w-12 h-12 text-primary" />
              </div>
              <CardTitle>Activate Gym Membership</CardTitle>
              <CardDescription>
                Get access to attendance tracking, rewards, and leaderboards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="energy" 
                onClick={() => createMember.mutate({})}
                disabled={createMember.isPending}
              >
                {createMember.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Fingerprint className="w-4 h-4 mr-2" />
                )}
                Activate Membership
              </Button>
            </CardContent>
          </Card>
        </main>
        <BottomNav />
      </div>
    );
  }

  // Get last check-in status
  const lastLog = logs?.[0];
  const isCheckedIn = lastLog?.status === 'checked_in';
  const todayLogs = logs?.filter(log => {
    const logDate = new Date(log.check_in_time).toDateString();
    return logDate === new Date().toDateString();
  }) || [];

  return (
    <div className="min-h-screen pb-24 safe-area-top">
      {/* Header */}
      <header className="p-4 flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Attendance</h1>
          <p className="text-sm text-muted-foreground">Member: {gymMember.member_code}</p>
        </div>
        <Badge variant={isCheckedIn ? 'default' : 'secondary'} className="gap-1">
          {isCheckedIn ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              Checked In
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3" />
              Not Checked In
            </>
          )}
        </Badge>
      </header>

      <main className="px-4 space-y-4">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center p-3">
            <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-lg font-bold">{streak?.current_streak || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </Card>
          
          <Card className="text-center p-3">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <Wallet className="w-4 h-4" />
              <span className="text-lg font-bold">{wallet?.balance || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Points</p>
          </Card>
          
          <Card className="text-center p-3">
            <div className="flex items-center justify-center gap-1 text-accent mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-lg font-bold">{stats?.totalDays || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total Days</p>
          </Card>
        </div>

        {/* Check-in Status Card */}
        {isCheckedIn && lastLog && (
          <Card className="border-l-4 border-l-green-500 bg-green-500/10">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-600">Currently Checked In</p>
                  <p className="text-sm text-muted-foreground">
                    Since {format(new Date(lastLog.check_in_time), 'h:mm a')}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Biometric Simulator */}
        <BiometricSimulator />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="text-[11px] sm:text-sm px-1 sm:px-3">Overview</TabsTrigger>
            <TabsTrigger value="history" className="text-[11px] sm:text-sm px-1 sm:px-3">History</TabsTrigger>
            <TabsTrigger value="points" className="text-[11px] sm:text-sm px-1 sm:px-3">Points</TabsTrigger>
            <TabsTrigger value="badges" className="text-[11px] sm:text-sm px-1 sm:px-3">Badges</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <AttendanceCard />
            
            {/* Today's Activity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Today's Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todayLogs.length > 0 ? (
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {todayLogs.map(log => (
                        <div key={log.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {log.status === 'checked_in' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-blue-500" />
                            )}
                            <span className="capitalize">{log.status.replace('_', ' ')}</span>
                          </div>
                          <span className="text-muted-foreground">
                            {format(new Date(log.check_in_time), 'h:mm a')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No activity today yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Stats Card */}
            {stats && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Your Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-primary">{stats.thisMonth}</p>
                      <p className="text-xs text-muted-foreground">This Month</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-accent">{stats.thisWeek}</p>
                      <p className="text-xs text-muted-foreground">This Week</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.averageDuration}m</p>
                      <p className="text-xs text-muted-foreground">Avg Duration</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.onTimePercentage}%</p>
                      <p className="text-xs text-muted-foreground">On-time Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <AttendanceHistory />
          </TabsContent>

          <TabsContent value="points" className="mt-4">
            <PointsWalletCard />
          </TabsContent>

          <TabsContent value="badges" className="mt-4">
            <MemberBadgesCard />
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
