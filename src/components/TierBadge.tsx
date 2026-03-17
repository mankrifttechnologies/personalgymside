import { useXP } from '@/hooks/useXP';
import { Shield } from 'lucide-react';

export type Tier = 'bronze' | 'silver' | 'gold' | 'diamond';

export const getTier = (level: number): Tier => {
  if (level >= 20) return 'diamond';
  if (level >= 10) return 'gold';
  if (level >= 5) return 'silver';
  return 'bronze';
};

const TIER_CONFIG: Record<Tier, { label: string; color: string; bg: string; icon: string }> = {
  bronze: { label: 'Bronze', color: 'text-amber-600', bg: 'bg-amber-600/15', icon: '🥉' },
  silver: { label: 'Silver', color: 'text-gray-300', bg: 'bg-gray-300/15', icon: '🥈' },
  gold: { label: 'Gold', color: 'text-yellow-400', bg: 'bg-yellow-400/15', icon: '🥇' },
  diamond: { label: 'Diamond', color: 'text-cyan-400', bg: 'bg-cyan-400/15', icon: '💎' },
};

export function TierBadge({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const { level } = useXP();
  const tier = getTier(level);
  const config = TIER_CONFIG[tier];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${config.bg} ${config.color} ${sizeClasses[size]}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

export function TierCard() {
  const { level, xp } = useXP();
  const tier = getTier(level);
  const config = TIER_CONFIG[tier];

  const nextTier = tier === 'bronze' ? 'silver' : tier === 'silver' ? 'gold' : tier === 'gold' ? 'diamond' : null;
  const nextLevel = tier === 'bronze' ? 5 : tier === 'silver' ? 10 : tier === 'gold' ? 20 : null;

  return (
    <div className="glass-card p-5 space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Shield className={`w-4 h-4 ${config.color}`} />
          </div>
          <h3 className="font-bold text-sm">Your Rank</h3>
        </div>
        <TierBadge size="md" />
      </div>
      {nextTier && nextLevel && (
        <div className="text-sm text-muted-foreground">
          Reach <span className="font-medium text-foreground">Level {nextLevel}</span> to unlock{' '}
          <span className={`font-semibold ${TIER_CONFIG[nextTier].color}`}>
            {TIER_CONFIG[nextTier].icon} {TIER_CONFIG[nextTier].label}
          </span>
        </div>
      )}
      {tier === 'diamond' && (
        <p className="text-sm text-cyan-400 font-semibold">🎉 You've reached the highest rank!</p>
      )}
    </div>
  );
}
