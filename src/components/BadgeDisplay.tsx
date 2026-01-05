import { useBadges, BADGES, Badge } from '@/hooks/useBadges';
import { Award, Lock } from 'lucide-react';

export default function BadgeDisplay() {
  const { earnedBadges, isLoading } = useBadges();

  const getBadgeStatus = (badge: Badge) => {
    const earned = earnedBadges.find(b => b.badge_id === badge.id);
    return { earned: !!earned, earnedAt: earned?.earned_at };
  };

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-4 animate-pulse">
        <div className="h-6 bg-secondary rounded w-32 mb-4" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-secondary rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const earnedCount = earnedBadges.length;
  const totalCount = BADGES.length;

  return (
    <div className="glass rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Achievements
        </h3>
        <span className="text-sm text-muted-foreground">
          {earnedCount}/{totalCount}
        </span>
      </div>
      
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
        {BADGES.map(badge => {
          const { earned, earnedAt } = getBadgeStatus(badge);
          
          return (
            <div
              key={badge.id}
              className={`relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all ${
                earned 
                  ? 'bg-primary/20 border border-primary/50' 
                  : 'bg-secondary/50 opacity-50'
              }`}
              title={`${badge.name}: ${badge.description}`}
            >
              <span className="text-2xl">{badge.icon}</span>
              <span className="text-[10px] text-center mt-1 leading-tight line-clamp-1">
                {badge.name}
              </span>
              {!earned && (
                <Lock className="absolute top-1 right-1 w-3 h-3 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
