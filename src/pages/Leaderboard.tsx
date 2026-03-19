import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLeaderboard, LeaderboardType } from '@/hooks/useLeaderboard';
import { useGymMember } from '@/hooks/useAttendance';
import { useMemberSearch, SearchableMember } from '@/hooks/useMemberSearch';
import { useRealtimeAttendance } from '@/hooks/useRealtimeAttendance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MemberSearchCard } from '@/components/MemberSearchCard';
import BottomNav from '@/components/BottomNav';
import { 
  ChevronLeft, 
  Trophy, 
  Flame, 
  Calendar, 
  Coins,
  Search,
  Crown,
  Medal,
  Dumbbell,
  Target,
  User,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-500" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Medal className="w-5 h-5 text-amber-600" />;
    default:
      return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  }
}

function getRankGradient(rank: number) {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50';
    case 2:
      return 'bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-400/50';
    case 3:
      return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/50';
    default:
      return '';
  }
}

interface MemberProfileDialogProps {
  member: SearchableMember;
  children: React.ReactNode;
}

function MemberProfileDialog({ member, children }: MemberProfileDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={member.avatar_url || undefined} />
              <AvatarFallback>
                {member.name?.[0]?.toUpperCase() || member.member_code[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold">{member.name || member.member_code}</p>
              <p className="text-sm text-muted-foreground font-normal">{member.member_code}</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {member.fitness_goal && (
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm capitalize">{member.fitness_goal.replace('_', ' ')}</span>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                <Flame className="w-4 h-4" />
                <span className="text-xl font-bold">{member.current_streak}</span>
              </div>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </Card>
            
            <Card className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-primary mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xl font-bold">{member.total_attendance_days}</span>
              </div>
              <p className="text-xs text-muted-foreground">Attendance</p>
            </Card>
            
            <Card className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-accent mb-1">
                <Dumbbell className="w-4 h-4" />
                <span className="text-xl font-bold">{member.total_workouts}</span>
              </div>
              <p className="text-xs text-muted-foreground">Workouts</p>
            </Card>
            
            <Card className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                <Coins className="w-4 h-4" />
                <span className="text-xl font-bold">{member.points_balance}</span>
              </div>
              <p className="text-xs text-muted-foreground">Points</p>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('streak');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { data: currentMember } = useGymMember();
  const { data: leaderboard, isLoading } = useLeaderboard(activeTab, 50);
  const { data: searchResults, isLoading: searchLoading } = useMemberSearch(searchQuery);

  // Enable realtime updates
  useRealtimeAttendance();

  const getValueLabel = (type: LeaderboardType) => {
    switch (type) {
      case 'streak':
        return { icon: Flame, label: 'days', color: 'text-orange-500' };
      case 'attendance':
        return { icon: Calendar, label: 'days', color: 'text-primary' };
      case 'points':
        return { icon: Coins, label: 'pts', color: 'text-yellow-500' };
    }
  };

  const getValue = (entry: any, type: LeaderboardType) => {
    switch (type) {
      case 'streak':
        return entry.current_streak;
      case 'attendance':
        return entry.total_attendance_days;
      case 'points':
        return entry.points_balance;
    }
  };

  const showSearch = searchQuery.trim().length > 0;

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
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground">Top performers</p>
        </div>
      </header>

      <main className="px-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search members by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {showSearch ? (
          /* Search Results with Full Member Cards */
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {searchLoading ? 'Searching...' : `${searchResults?.length || 0} members found`}
              </span>
            </div>
            
            {searchLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3 pr-2">
                  {searchResults.map(member => (
                    <MemberSearchCard key={member.member_id} member={member} />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <Card className="py-12 text-center">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No members found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try searching with a different name
                </p>
              </Card>
            )}
          </div>
        ) : (
          /* Leaderboard Tabs */
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeaderboardType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="streak" className="gap-1">
                <Flame className="w-4 h-4" />
                Streak
              </TabsTrigger>
              <TabsTrigger value="attendance" className="gap-1">
                <Calendar className="w-4 h-4" />
                Attendance
              </TabsTrigger>
              <TabsTrigger value="points" className="gap-1">
                <Coins className="w-4 h-4" />
                Points
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : leaderboard && leaderboard.length > 0 ? (
                <>
                  {/* Top 3 Podium */}
                  <div className="flex justify-center items-end gap-2 mb-6 h-40">
                    {/* 2nd Place */}
                    {leaderboard[1] && (
                      <div className="flex flex-col items-center">
                        <Avatar className="w-12 h-12 border-2 border-gray-400">
                          <AvatarImage src={leaderboard[1].avatar_url || undefined} />
                          <AvatarFallback>
                            {leaderboard[1].name?.[0]?.toUpperCase() || '2'}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xs font-medium mt-1 truncate max-w-[80px]">
                          {leaderboard[1].name || leaderboard[1].member_code}
                        </p>
                        <div className="w-16 h-20 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg flex items-center justify-center mt-1">
                          <span className="text-2xl font-bold text-white">2</span>
                        </div>
                      </div>
                    )}
                    
                    {/* 1st Place */}
                    {leaderboard[0] && (
                      <div className="flex flex-col items-center">
                        <Crown className="w-6 h-6 text-yellow-500 mb-1" />
                        <Avatar className="w-14 h-14 border-2 border-yellow-500">
                          <AvatarImage src={leaderboard[0].avatar_url || undefined} />
                          <AvatarFallback>
                            {leaderboard[0].name?.[0]?.toUpperCase() || '1'}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium mt-1 truncate max-w-[80px]">
                          {leaderboard[0].name || leaderboard[0].member_code}
                        </p>
                        <div className="w-20 h-28 bg-gradient-to-t from-yellow-500 to-amber-400 rounded-t-lg flex items-center justify-center mt-1">
                          <span className="text-3xl font-bold text-white">1</span>
                        </div>
                      </div>
                    )}
                    
                    {/* 3rd Place */}
                    {leaderboard[2] && (
                      <div className="flex flex-col items-center">
                        <Avatar className="w-12 h-12 border-2 border-amber-600">
                          <AvatarImage src={leaderboard[2].avatar_url || undefined} />
                          <AvatarFallback>
                            {leaderboard[2].name?.[0]?.toUpperCase() || '3'}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xs font-medium mt-1 truncate max-w-[80px]">
                          {leaderboard[2].name || leaderboard[2].member_code}
                        </p>
                        <div className="w-16 h-16 bg-gradient-to-t from-amber-600 to-orange-500 rounded-t-lg flex items-center justify-center mt-1">
                          <span className="text-2xl font-bold text-white">3</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Full List */}
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {leaderboard.map(entry => {
                        const valueInfo = getValueLabel(activeTab);
                        const ValueIcon = valueInfo.icon;
                        const isCurrentUser = entry.member_id === currentMember?.id;
                        
                        return (
                          <div
                            key={entry.member_id}
                            onClick={() => navigate(`/member/${entry.member_id}`)}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                              isCurrentUser 
                                ? 'bg-primary/10 border-primary/50' 
                                : getRankGradient(entry.rank) || 'hover:bg-secondary/50 border-transparent'
                            }`}
                          >
                            <div className="w-8 flex justify-center">
                              {getRankIcon(entry.rank)}
                            </div>
                            
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={entry.avatar_url || undefined} />
                              <AvatarFallback>
                                {entry.name?.[0]?.toUpperCase() || entry.member_code[0]}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {entry.name || entry.member_code}
                                {isCurrentUser && (
                                  <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">{entry.member_code}</p>
                            </div>
                            
                            <div className={`flex items-center gap-1 font-bold ${valueInfo.color}`}>
                              <ValueIcon className="w-4 h-4" />
                              <span>{getValue(entry, activeTab)}</span>
                              <span className="text-xs font-normal text-muted-foreground">
                                {valueInfo.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <Card className="py-12 text-center">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No members on the leaderboard yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start tracking attendance to climb the ranks!
                  </p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
