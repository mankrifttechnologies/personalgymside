import { useParams, useNavigate } from 'react-router-dom';
import { useMemberProfile } from '@/hooks/useMemberSearch';
import { useFollows } from '@/hooks/useFollows';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Flame, 
  Trophy, 
  Dumbbell, 
  Calendar, 
  Star, 
  Award,
  Target,
  Clock,
  TrendingUp,
  UserPlus,
  UserMinus,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import BottomNav from '@/components/BottomNav';

export default function MemberProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: member, isLoading, error } = useMemberProfile(id || null);
  const { isFollowing, toggleFollow, isLoading: followLoading } = useFollows();

  const isOwnProfile = user?.id === member?.user_id;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container max-w-md mx-auto p-4 space-y-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container max-w-md mx-auto p-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">Member not found</p>
              <Button className="mt-4" onClick={() => navigate('/leaderboard')}>
                View Leaderboard
              </Button>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    );
  }

  const rating = Math.min(100, Math.round(
    (member.total_attendance_days * 2) + 
    (member.total_workouts * 3) + 
    (member.current_streak * 5)
  ));

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-md mx-auto p-4 space-y-4">
        {/* Header */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        {/* Profile Header Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                <AvatarImage src={member.profile?.avatar_url || ''} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {member.profile?.name?.charAt(0) || member.member_code.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">
                  {member.profile?.name || member.member_code}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-sm">#{member.member_code}</span>
                  {member.batch && (
                    <Badge variant="secondary" className="text-xs">{member.batch}</Badge>
                  )}
                </div>
                {member.profile?.fitness_goal && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                    <Target className="h-3 w-3" />
                    <span className="capitalize">{member.profile.fitness_goal.replace('_', ' ')}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Follow Button */}
            {user && !isOwnProfile && (
              <div className="mt-4">
                <Button
                  onClick={() => toggleFollow(member.user_id)}
                  disabled={followLoading}
                  variant={isFollowing(member.user_id) ? "outline" : "default"}
                  className="w-full"
                >
                  {isFollowing(member.user_id) ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          
          {/* Rating Section */}
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Fitness Rating</span>
              <span className="text-lg font-bold text-primary">{rating}/100</span>
            </div>
            <Progress value={rating} className="h-3" />
            <p className="text-xs text-muted-foreground mt-1">
              Based on attendance, workouts, and consistency
            </p>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Flame className="h-6 w-6 mx-auto text-orange-500 mb-2" />
              <p className="text-2xl font-bold">{member.current_streak}</p>
              <p className="text-xs text-muted-foreground">Current Streak</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
              <p className="text-2xl font-bold">{member.longest_streak}</p>
              <p className="text-xs text-muted-foreground">Longest Streak</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Dumbbell className="h-6 w-6 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{member.total_workouts}</p>
              <p className="text-xs text-muted-foreground">Workouts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold">{member.total_attendance_days}</p>
              <p className="text-xs text-muted-foreground">Days Attended</p>
            </CardContent>
          </Card>
        </div>

        {/* Points & Level */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Points & Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Points</span>
              <span className="font-bold text-primary">{member.points_balance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Earned</span>
              <span className="font-bold">{member.total_points_earned.toLocaleString()}</span>
            </div>
            {member.profile?.level && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Level</span>
                <Badge variant="secondary">Level {member.profile.level}</Badge>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Member Since</span>
              <span className="text-sm">{format(new Date(member.joined_at), 'MMM yyyy')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-500" />
              Badges ({member.badges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {member.badges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {member.badges.map((badge, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="px-3 py-1.5 bg-gradient-to-r from-primary/10 to-primary/5"
                  >
                    <span className="mr-1">🏅</span>
                    {badge.badge_name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No badges earned yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Attendance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Recent Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {member.attendance_logs.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {member.attendance_logs.slice(0, 10).map((log) => (
                  <div 
                    key={log.id} 
                    className="flex justify-between items-center p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        log.is_on_time ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <span className="text-sm">
                        {format(new Date(log.check_in_time), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.check_in_time), 'h:mm a')}
                      </span>
                      {log.duration_minutes && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({log.duration_minutes} min)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No attendance records yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Activity Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-primary">
                  {member.attendance_logs.filter(l => l.is_on_time).length}
                </p>
                <p className="text-xs text-muted-foreground">On-Time Check-ins</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-primary">
                  {member.attendance_logs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
}
