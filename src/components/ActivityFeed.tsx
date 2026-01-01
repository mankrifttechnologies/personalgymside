import { Dumbbell, Trophy, Scale, Utensils, User } from 'lucide-react';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { format, formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  showOnlyFriends?: boolean;
}

const activityIcons: Record<string, React.ReactNode> = {
  workout: <Dumbbell className="w-4 h-4" />,
  pr: <Trophy className="w-4 h-4" />,
  measurement: <Scale className="w-4 h-4" />,
  nutrition: <Utensils className="w-4 h-4" />,
  default: <User className="w-4 h-4" />,
};

const activityColors: Record<string, string> = {
  workout: 'bg-primary/20 text-primary',
  pr: 'bg-warning/20 text-warning',
  measurement: 'bg-accent/20 text-accent',
  nutrition: 'bg-orange-500/20 text-orange-500',
  default: 'bg-secondary text-muted-foreground',
};

export default function ActivityFeed({ showOnlyFriends = false }: ActivityFeedProps) {
  const { activities, friendActivities, isLoading } = useActivityFeed();

  const displayActivities = showOnlyFriends ? friendActivities : activities;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse p-3 rounded-lg bg-secondary/30">
            <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
            <div className="h-3 bg-secondary rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!displayActivities || displayActivities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          {showOnlyFriends ? 'No friend activity yet' : 'No recent activity'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayActivities.slice(0, 10).map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
        >
          <div className={`p-2 rounded-lg ${activityColors[activity.activity_type] || activityColors.default}`}>
            {activityIcons[activity.activity_type] || activityIcons.default}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{activity.title}</p>
            {activity.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {activity.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
