import { useXP, XP_PER_LEVEL } from '@/hooks/useXP';
import { Star, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function LevelProgress() {
  const { xp, level, progress, xpToNext, isLoading } = useXP();

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-4 animate-pulse">
        <div className="h-6 bg-secondary rounded w-24 mb-2" />
        <div className="h-4 bg-secondary rounded w-full" />
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">{level}</span>
            </div>
            <Star className="absolute -top-1 -right-1 w-5 h-5 text-warning fill-warning" />
          </div>
          <div>
            <p className="font-semibold">Level {level}</p>
            <p className="text-xs text-muted-foreground">{xp.toLocaleString()} XP total</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-primary flex items-center gap-1">
            <Zap className="w-4 h-4" />
            +{xpToNext} XP
          </p>
          <p className="text-xs text-muted-foreground">to level {level + 1}</p>
        </div>
      </div>
      
      <div className="space-y-1">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">
          {Math.round(progress)}% to next level
        </p>
      </div>
    </div>
  );
}
