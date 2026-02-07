import { useNavigate } from 'react-router-dom';
import { SearchableMember } from '@/hooks/useMemberSearch';
import { useFollows } from '@/hooks/useFollows';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Flame, 
  Calendar, 
  Coins, 
  Dumbbell, 
  Target, 
  UserPlus, 
  UserMinus,
  ChevronRight
} from 'lucide-react';

interface MemberSearchCardProps {
  member: SearchableMember;
}

export function MemberSearchCard({ member }: MemberSearchCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFollowing, toggleFollow, isLoading } = useFollows();

  const isOwnProfile = user?.id === member.user_id;

  const rating = Math.min(100, Math.round(
    (member.total_attendance_days * 2) + 
    (member.total_workouts * 3) + 
    (member.current_streak * 5)
  ));

  const handleViewProfile = () => {
    // Use member_id if available, otherwise fallback to user_id
    const profileId = member.member_id || member.user_id;
    navigate(`/member/${profileId}`);
  };

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFollow(member.user_id);
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleViewProfile}
    >
      <CardContent className="p-3 sm:p-4">
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Avatar className="h-11 w-11 sm:h-14 sm:w-14 border-2 border-primary/20 shrink-0">
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm sm:text-base">
              {member.name?.[0]?.toUpperCase() || member.member_code[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base truncate">
                  {member.name || member.member_code}
                </h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">#{member.member_code}</p>
              </div>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
            </div>
            {member.fitness_goal && (
              <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                <Target className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[10px] sm:text-xs text-muted-foreground capitalize truncate">
                  {member.fitness_goal.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Rating Bar */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">Fitness Rating</span>
            <span className="text-xs sm:text-sm font-bold text-primary">{rating}/100</span>
          </div>
          <Progress value={rating} className="h-1.5 sm:h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-3 sm:mb-4">
          <div className="text-center p-1.5 sm:p-2 rounded-lg bg-orange-500/10">
            <Flame className="h-3 w-3 sm:h-4 sm:w-4 mx-auto text-orange-500 mb-0.5 sm:mb-1" />
            <p className="text-xs sm:text-sm font-bold">{member.current_streak}</p>
            <p className="text-[8px] sm:text-[10px] text-muted-foreground">Streak</p>
          </div>
          <div className="text-center p-1.5 sm:p-2 rounded-lg bg-blue-500/10">
            <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4 mx-auto text-blue-500 mb-0.5 sm:mb-1" />
            <p className="text-xs sm:text-sm font-bold">{member.total_workouts}</p>
            <p className="text-[8px] sm:text-[10px] text-muted-foreground">Workouts</p>
          </div>
          <div className="text-center p-1.5 sm:p-2 rounded-lg bg-green-500/10">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mx-auto text-green-500 mb-0.5 sm:mb-1" />
            <p className="text-xs sm:text-sm font-bold">{member.total_attendance_days}</p>
            <p className="text-[8px] sm:text-[10px] text-muted-foreground">Days</p>
          </div>
          <div className="text-center p-1.5 sm:p-2 rounded-lg bg-yellow-500/10">
            <Coins className="h-3 w-3 sm:h-4 sm:w-4 mx-auto text-yellow-500 mb-0.5 sm:mb-1" />
            <p className="text-xs sm:text-sm font-bold">{member.points_balance}</p>
            <p className="text-[8px] sm:text-[10px] text-muted-foreground">Points</p>
          </div>
        </div>

        {/* Follow Button */}
        {user && !isOwnProfile && (
          <Button
            onClick={handleFollow}
            disabled={isLoading}
            variant={isFollowing(member.user_id) ? "outline" : "default"}
            size="sm"
            className="w-full h-8 sm:h-9 text-xs sm:text-sm"
          >
            {isFollowing(member.user_id) ? (
              <>
                <UserMinus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Unfollow
              </>
            ) : (
              <>
                <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Follow
              </>
            )}
          </Button>
        )}

        {isOwnProfile && (
          <Badge variant="secondary" className="w-full justify-center py-1 text-xs">
            Your Profile
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
