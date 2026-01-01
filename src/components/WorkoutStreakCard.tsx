import { Flame, Trophy, Calendar } from 'lucide-react';
import { useWorkoutStreak } from '@/hooks/useWorkoutStreak';

export default function WorkoutStreakCard() {
  const { streak, longestStreak, totalWorkouts, isLoading } = useWorkoutStreak();

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-4 animate-pulse">
        <div className="h-16 bg-secondary/50 rounded" />
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          Workout Streak
        </h3>
        {streak >= 7 && (
          <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
            On Fire! 🔥
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame className={`w-6 h-6 ${streak > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="text-3xl font-bold">{streak}</span>
          </div>
          <p className="text-xs text-muted-foreground">Current Streak</p>
        </div>
        
        <div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <Trophy className="w-6 h-6 text-warning" />
            <span className="text-3xl font-bold">{longestStreak}</span>
          </div>
          <p className="text-xs text-muted-foreground">Best Streak</p>
        </div>
        
        <div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calendar className="w-6 h-6 text-accent" />
            <span className="text-3xl font-bold">{totalWorkouts}</span>
          </div>
          <p className="text-xs text-muted-foreground">Total Workouts</p>
        </div>
      </div>
      
      {streak > 0 && (
        <div className="mt-4 p-2 rounded-lg bg-primary/10 text-center">
          <p className="text-sm text-primary font-medium">
            {streak === 1 
              ? "Great start! Keep it going! 💪" 
              : streak < 7 
                ? `${7 - streak} more days to a week streak!`
                : streak < 30
                  ? `Amazing! ${30 - streak} days to a month streak!`
                  : "Incredible dedication! You're a champion! 🏆"
            }
          </p>
        </div>
      )}
    </div>
  );
}
