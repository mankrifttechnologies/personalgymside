import { useMemo } from 'react';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Flame, Dumbbell, Medal } from 'lucide-react';

interface LeaderboardEntry {
  userId: string;
  name: string;
  workoutStreak: number;
  totalPRs: number;
  topPRWeight: number;
}

export default function FriendsLeaderboard() {
  const { user } = useAuth();
  const { acceptedFriends } = useFriends();

  // Fetch leaderboard data for all friends and self
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['leaderboard', user?.id, acceptedFriends.length],
    queryFn: async () => {
      if (!user) return [];
      
      // Get all user IDs to fetch data for (friends + self)
      const userIds = [user.id, ...acceptedFriends.map(f => f.friendUserId)];
      
      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);
      
      // Fetch workouts for streak calculation (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: workouts } = await supabase
        .from('workouts')
        .select('user_id, workout_date')
        .in('user_id', userIds)
        .gte('workout_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('workout_date', { ascending: false });
      
      // Fetch personal records
      const { data: records } = await supabase
        .from('personal_records')
        .select('user_id, max_weight_kg')
        .in('user_id', userIds);
      
      // Calculate leaderboard entries
      const entries: LeaderboardEntry[] = userIds.map(userId => {
        const profile = profiles?.find(p => p.user_id === userId);
        const userWorkouts = workouts?.filter(w => w.user_id === userId) || [];
        const userRecords = records?.filter(r => r.user_id === userId) || [];
        
        // Calculate streak
        let streak = 0;
        if (userWorkouts.length > 0) {
          const sortedDates = [...new Set(userWorkouts.map(w => w.workout_date))].sort().reverse();
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          
          // Check if worked out today or yesterday to start counting
          if (sortedDates[0] === today || sortedDates[0] === yesterday) {
            streak = 1;
            for (let i = 1; i < sortedDates.length; i++) {
              const currentDate = new Date(sortedDates[i - 1]);
              const prevDate = new Date(sortedDates[i]);
              const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / 86400000);
              
              if (diffDays === 1) {
                streak++;
              } else {
                break;
              }
            }
          }
        }
        
        // Calculate PR stats
        const totalPRs = userRecords.length;
        const topPRWeight = userRecords.length > 0 
          ? Math.max(...userRecords.map(r => Number(r.max_weight_kg)))
          : 0;
        
        return {
          userId,
          name: profile?.name || (userId === user.id ? 'You' : 'Friend'),
          workoutStreak: streak,
          totalPRs,
          topPRWeight,
        };
      });
      
      return entries;
    },
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });

  // Sort by streak, then by PRs
  const sortedByStreak = useMemo(() => {
    if (!leaderboardData) return [];
    return [...leaderboardData].sort((a, b) => b.workoutStreak - a.workoutStreak);
  }, [leaderboardData]);

  const sortedByPRs = useMemo(() => {
    if (!leaderboardData) return [];
    return [...leaderboardData].sort((a, b) => b.topPRWeight - a.topPRWeight);
  }, [leaderboardData]);

  const getMedalColor = (index: number) => {
    if (index === 0) return 'text-yellow-400';
    if (index === 1) return 'text-gray-400';
    if (index === 2) return 'text-orange-600';
    return 'text-muted-foreground';
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-secondary rounded-lg" />
        <div className="h-20 bg-secondary rounded-lg" />
      </div>
    );
  }

  if (!leaderboardData || leaderboardData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Add friends to see the leaderboard!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Streak Leaderboard */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          Workout Streaks
        </h4>
        <div className="space-y-2">
          {sortedByStreak.slice(0, 5).map((entry, idx) => (
            <div 
              key={entry.userId}
              className={`flex items-center justify-between p-3 rounded-lg ${
                entry.userId === user?.id ? 'bg-primary/10 border border-primary/30' : 'bg-secondary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Medal className={`w-5 h-5 ${getMedalColor(idx)}`} />
                <span className={`font-medium text-sm ${entry.userId === user?.id ? 'text-primary' : ''}`}>
                  {entry.userId === user?.id ? 'You' : entry.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-primary" />
                <span className="font-bold text-primary">{entry.workoutStreak}</span>
                <span className="text-xs text-muted-foreground">days</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PR Leaderboard */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-accent" />
          Top Lifters
        </h4>
        <div className="space-y-2">
          {sortedByPRs.slice(0, 5).map((entry, idx) => (
            <div 
              key={entry.userId}
              className={`flex items-center justify-between p-3 rounded-lg ${
                entry.userId === user?.id ? 'bg-accent/10 border border-accent/30' : 'bg-secondary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Medal className={`w-5 h-5 ${getMedalColor(idx)}`} />
                <div>
                  <span className={`font-medium text-sm ${entry.userId === user?.id ? 'text-accent' : ''}`}>
                    {entry.userId === user?.id ? 'You' : entry.name}
                  </span>
                  <p className="text-xs text-muted-foreground">{entry.totalPRs} PRs</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-accent">{entry.topPRWeight}kg</span>
                <p className="text-xs text-muted-foreground">best lift</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
