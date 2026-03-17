import { Flame, Trophy, Calendar } from 'lucide-react';
import { useWorkoutStreak } from '@/hooks/useWorkoutStreak';

export default function WorkoutStreakCard() {
  const { streak, longestStreak, totalWorkouts, isLoading } = useWorkoutStreak();

  if (isLoading) {
    return (
      <div className="glass-card p-5 animate-pulse">
        <div className="h-16 bg-secondary/50 rounded" />
      </div>
    );
  }

  return (
    <div className="glass-card p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          Workout Streak
        </h3>
        {streak >= 7 && (
          <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold">
            On Fire! 🔥
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 rounded-xl bg-primary/10">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame className={`w-5 h-5 ${streak > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="text-2xl font-extrabold">{streak}</span>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">Current</p>
        </div>
        
        <div className="p-3 rounded-xl bg-warning/10">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Trophy className="w-5 h-5 text-warning" />
            <span className="text-2xl font-extrabold">{longestStreak}</span>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">Best</p>
        </div>
        
        <div className="p-3 rounded-xl bg-accent/10">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calendar className="w-5 h-5 text-accent" />
            <span className="text-2xl font-extrabold">{totalWorkouts}</span>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">Total</p>
        </div>
      </div>
      
      {streak > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-primary/10 text-center">
          <p className="text-sm text-primary font-semibold">
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
