import { useXP, XP_PER_LEVEL } from '@/hooks/useXP';
import { Star, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { TierBadge } from '@/components/TierBadge';

export default function LevelProgress() {
  const { xp, level, progress, xpToNext, isLoading } = useXP();

  if (isLoading) {
    return (
      <div className="glass-card p-5 animate-pulse">
        <div className="h-6 bg-secondary rounded w-24 mb-2" />
        <div className="h-4 bg-secondary rounded w-full" />
      </div>
    );
  }

  return (
    <div className="glass-card p-5 space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <span className="text-xl font-extrabold text-primary-foreground">{level}</span>
            </div>
            <Star className="absolute -top-1.5 -right-1.5 w-5 h-5 text-warning fill-warning drop-shadow" />
          </div>
          <div>
            <p className="font-bold text-base">Level {level}</p>
            <p className="text-xs text-muted-foreground">{xp.toLocaleString()} XP total</p>
            <TierBadge size="sm" />
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-primary flex items-center gap-1 justify-end">
            <Zap className="w-4 h-4" />
            +{xpToNext} XP
          </p>
          <p className="text-xs text-muted-foreground">to level {level + 1}</p>
        </div>
      </div>
      
      <div className="space-y-1.5">
        <Progress value={progress} className="h-2.5" />
        <p className="text-xs text-muted-foreground text-center font-medium">
          {Math.round(progress)}% to next level
        </p>
      </div>
    </div>
  );
}
