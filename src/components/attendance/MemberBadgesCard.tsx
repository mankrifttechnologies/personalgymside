import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Flame, 
  Trophy,
  Star,
  Zap,
  Crown
} from 'lucide-react';
import { useGymMember, useMemberBadges } from '@/hooks/useAttendance';
import { format } from 'date-fns';

const BADGE_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
  streak_7: { icon: Flame, color: 'text-orange-500', bgColor: 'bg-orange-500/20' },
  streak_14: { icon: Zap, color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' },
  streak_30: { icon: Trophy, color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
  streak_60: { icon: Star, color: 'text-purple-500', bgColor: 'bg-purple-500/20' },
  streak_100: { icon: Crown, color: 'text-amber-500', bgColor: 'bg-amber-500/20' },
  first_checkin: { icon: Award, color: 'text-green-500', bgColor: 'bg-green-500/20' },
};

const AVAILABLE_BADGES = [
  { type: 'streak_7', name: 'Week Warrior', requirement: '7-day streak' },
  { type: 'streak_14', name: 'Two Week Champion', requirement: '14-day streak' },
  { type: 'streak_30', name: 'Monthly Master', requirement: '30-day streak' },
  { type: 'streak_60', name: 'Iron Will', requirement: '60-day streak' },
  { type: 'streak_100', name: 'Legendary', requirement: '100-day streak' },
];

export function MemberBadgesCard() {
  const { data: member } = useGymMember();
  const { data: earnedBadges } = useMemberBadges(member?.id);

  const earnedBadgeTypes = new Set(earnedBadges?.map(b => b.badge_type) || []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Badges & Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {AVAILABLE_BADGES.map(badge => {
            const isEarned = earnedBadgeTypes.has(badge.type);
            const config = BADGE_CONFIG[badge.type] || BADGE_CONFIG.streak_7;
            const Icon = config.icon;
            const earnedBadge = earnedBadges?.find(b => b.badge_type === badge.type);

            return (
              <div
                key={badge.type}
                className={`relative flex flex-col items-center p-4 rounded-xl transition-all ${
                  isEarned 
                    ? `${config.bgColor} border-2 border-current ${config.color}` 
                    : 'bg-muted/30 opacity-40 grayscale'
                }`}
              >
                <div className={`p-3 rounded-full ${isEarned ? config.bgColor : 'bg-muted'}`}>
                  <Icon className={`h-8 w-8 ${isEarned ? config.color : 'text-muted-foreground'}`} />
                </div>
                <h4 className="mt-2 font-semibold text-sm text-center">{badge.name}</h4>
                <p className="text-xs text-muted-foreground text-center">{badge.requirement}</p>
                
                {isEarned && earnedBadge && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {format(new Date(earnedBadge.earned_at), 'MMM d')}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {earnedBadges && earnedBadges.length === 0 && (
          <p className="text-center text-muted-foreground mt-4">
            Start building your streak to earn badges! 💪
          </p>
        )}
      </CardContent>
    </Card>
  );
}
