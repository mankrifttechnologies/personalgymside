import { useFriendData } from '@/hooks/useFriendData';
import { 
  User, Flame, Trophy, Dumbbell, Scale, 
  Utensils, ChevronRight, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FriendProfileViewProps {
  friendUserId: string;
  onStartChat?: () => void;
}

export default function FriendProfileView({ friendUserId, onStartChat }: FriendProfileViewProps) {
  const {
    profile,
    workouts,
    personalRecords,
    measurements,
    calorieEntries,
    streak,
    totalWorkouts,
    isLoading,
  } = useFriendData(friendUserId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  const latestMeasurement = measurements?.[0];
  const todayCalories = calorieEntries?.reduce((sum, e) => sum + (e.calories || 0), 0) || 0;

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="flex items-center gap-4 p-4 glass rounded-xl">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-8 h-8 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{profile.name || 'Athlete'}</h2>
          <p className="text-sm text-muted-foreground capitalize">
            {profile.fitness_goal || 'Fitness Enthusiast'}
          </p>
        </div>
        {onStartChat && (
          <Button variant="energy" size="sm" onClick={onStartChat}>
            Message
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-3 text-center">
          <Flame className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{streak}</p>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <Dumbbell className="w-5 h-5 text-accent mx-auto mb-1" />
          <p className="text-2xl font-bold">{totalWorkouts}</p>
          <p className="text-xs text-muted-foreground">Workouts</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <Trophy className="w-5 h-5 text-warning mx-auto mb-1" />
          <p className="text-2xl font-bold">{personalRecords?.length || 0}</p>
          <p className="text-xs text-muted-foreground">PRs</p>
        </div>
      </div>

      {/* Tabs for different data */}
      <Tabs defaultValue="workouts" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
          <TabsTrigger value="prs">PRs</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
        </TabsList>

        <TabsContent value="workouts" className="mt-4">
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold mb-3">Recent Workouts</h3>
            {workouts && workouts.length > 0 ? (
              <div className="space-y-2">
                {workouts.slice(0, 5).map((workout) => (
                  <div key={workout.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                    <div>
                      <p className="text-sm font-medium">{workout.workout_date}</p>
                      <p className="text-xs text-muted-foreground">
                        {workout.workout_exercises?.length || 0} exercises
                      </p>
                    </div>
                    {workout.total_duration_minutes && (
                      <span className="text-xs text-muted-foreground">
                        {workout.total_duration_minutes} min
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No workouts yet</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="prs" className="mt-4">
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold mb-3">Personal Records</h3>
            {personalRecords && personalRecords.length > 0 ? (
              <div className="space-y-2">
                {personalRecords.slice(0, 5).map((pr) => (
                  <div key={pr.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                    <div>
                      <p className="text-sm font-medium">{pr.exercise_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{pr.muscle_group}</p>
                    </div>
                    <span className="text-primary font-bold">
                      {pr.max_weight_kg}kg × {pr.max_reps}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No PRs yet</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="body" className="mt-4">
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold mb-3">Body Stats</h3>
            {latestMeasurement ? (
              <div className="grid grid-cols-2 gap-3">
                {latestMeasurement.weight_kg && (
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <Scale className="w-5 h-5 mx-auto mb-1 text-accent" />
                    <p className="text-lg font-bold">{latestMeasurement.weight_kg} kg</p>
                    <p className="text-xs text-muted-foreground">Weight</p>
                  </div>
                )}
                {latestMeasurement.body_fat_percentage && (
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <p className="text-lg font-bold">{latestMeasurement.body_fat_percentage}%</p>
                    <p className="text-xs text-muted-foreground">Body Fat</p>
                  </div>
                )}
                {latestMeasurement.chest_cm && (
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <p className="text-lg font-bold">{latestMeasurement.chest_cm} cm</p>
                    <p className="text-xs text-muted-foreground">Chest</p>
                  </div>
                )}
                {latestMeasurement.biceps_cm && (
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <p className="text-lg font-bold">{latestMeasurement.biceps_cm} cm</p>
                    <p className="text-xs text-muted-foreground">Biceps</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No measurements yet</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="nutrition" className="mt-4">
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold mb-3">Today's Nutrition</h3>
            <div className="text-center p-4">
              <Utensils className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <p className="text-3xl font-bold">{todayCalories}</p>
              <p className="text-sm text-muted-foreground">calories today</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
