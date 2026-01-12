import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Trophy, 
  Flame, 
  Medal,
  Crown,
  Star,
  ArrowRight
} from 'lucide-react';
import { useLeaderboard, LeaderboardType } from '@/hooks/useLeaderboard';
import { useGymMember } from '@/hooks/useAttendance';
import { Link } from 'react-router-dom';

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="w-5 text-center font-bold text-muted-foreground">{rank}</span>;
  }
};

const getRankBadge = (rank: number) => {
  if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
  if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500';
  if (rank === 3) return 'bg-gradient-to-r from-amber-500 to-amber-700';
  return '';
};

interface LeaderboardCardProps {
  showFull?: boolean;
}

export function LeaderboardCard({ showFull = false }: LeaderboardCardProps) {
  const [type, setType] = useState<LeaderboardType>('streak');
  const { data: leaderboard, isLoading } = useLeaderboard(type, showFull ? 50 : 10);
  const { data: myMember } = useGymMember();

  const getValueForType = (entry: any) => {
    switch (type) {
      case 'streak':
        return { value: entry.current_streak, label: 'day streak', icon: Flame };
      case 'attendance':
        return { value: entry.total_attendance_days, label: 'days', icon: Trophy };
      case 'points':
        return { value: entry.points_balance, label: 'pts', icon: Star };
      default:
        return { value: 0, label: '', icon: Trophy };
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Leaderboard
          </CardTitle>
          {!showFull && (
            <Link to="/leaderboard">
              <Button variant="ghost" size="sm" className="gap-1">
                View All
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={type} onValueChange={(v) => setType(v as LeaderboardType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="streak" className="gap-1">
              <Flame className="h-4 w-4" />
              Streak
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-1">
              <Trophy className="h-4 w-4" />
              Days
            </TabsTrigger>
            <TabsTrigger value="points" className="gap-1">
              <Star className="h-4 w-4" />
              Points
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <ScrollArea className={showFull ? 'h-[500px]' : 'h-[300px]'}>
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : leaderboard?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No members yet
              </div>
            ) : (
              leaderboard?.map((entry) => {
                const { value, label, icon: Icon } = getValueForType(entry);
                const isMe = myMember?.id === entry.member_id;

                return (
                  <div
                    key={entry.member_id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isMe 
                        ? 'bg-primary/10 border-2 border-primary/30' 
                        : 'bg-muted/50 hover:bg-muted'
                    } ${entry.rank <= 3 ? getRankBadge(entry.rank) + ' text-white' : ''}`}
                  >
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(entry.rank)}
                    </div>

                    <Avatar className="h-10 w-10">
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback>
                        {entry.name?.charAt(0) || entry.member_code.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${entry.rank <= 3 ? 'text-white' : ''}`}>
                        {entry.name || entry.member_code}
                        {isMe && <Badge className="ml-2" variant="secondary">You</Badge>}
                      </p>
                      <p className={`text-sm ${entry.rank <= 3 ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {entry.member_code}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Icon className={`h-4 w-4 ${entry.rank <= 3 ? 'text-white' : 'text-primary'}`} />
                      <span className="font-bold">{value}</span>
                      <span className={`text-xs ${entry.rank <= 3 ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
