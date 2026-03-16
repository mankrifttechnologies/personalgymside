import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWorkouts, useMuscleRecovery } from '@/hooks/useWorkouts';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { MUSCLE_GROUPS } from '@/types/fitness';
import BottomNav from '@/components/BottomNav';
import { 
  TrendingUp, ChevronLeft, Calendar, Flame, Dumbbell,
  Target, History
} from 'lucide-react';

export default function Progress() {
  const { user, loading: authLoading } = useAuth();
  const { workouts } = useWorkouts();
  const { muscleRecovery, getRecoveryStatus } = useMuscleRecovery();
  const { profile } = useProfile();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-glow p-4 rounded-full bg-primary/20">
          <TrendingUp className="w-8 h-8 text-primary animate-float" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Calculate stats
  const totalWorkouts = workouts?.length || 0;
  const thisWeekWorkouts = workouts?.filter(w => {
    const workoutDate = new Date(w.workout_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return workoutDate >= weekAgo;
  }).length || 0;

  const totalCaloriesBurned = workouts?.reduce((acc, w) => acc + (w.calories_burned || 0), 0) || 0;

  // Get muscle training frequency
  const muscleStats = MUSCLE_GROUPS.map(muscle => {
    const status = getRecoveryStatus(muscle.value);
    return {
      ...muscle,
      status: status.status,
      daysSince: status.days,
    };
  });

  // Get last 7 days workout activity
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const hasWorkout = workouts?.some(w => w.workout_date === dateStr);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      hasWorkout,
    };
  });

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="p-4 flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Progress</h1>
          <p className="text-sm text-muted-foreground">Track your fitness journey</p>
        </div>
        <Link to="/history">
          <Button variant="glass" size="sm" className="gap-1">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </Button>
        </Link>
      </header>

      <main className="px-4 space-y-6">
        {/* Weekly Overview */}
        <div className="glass rounded-xl p-4 animate-slide-up">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            This Week
          </h3>
          <div className="flex justify-between mb-4 gap-1">
            {last7Days.map((day, idx) => (
              <div key={idx} className="text-center flex-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">{day.day}</p>
                <div 
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium mx-auto ${
                    day.hasWorkout 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {day.date}
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {thisWeekWorkouts} workout{thisWeekWorkouts !== 1 ? 's' : ''} this week
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Workouts</span>
            </div>
            <p className="text-3xl font-bold">{totalWorkouts}</p>
          </div>
          
          <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Calories Burned</span>
            </div>
            <p className="text-3xl font-bold">{totalCaloriesBurned.toLocaleString()}</p>
          </div>
        </div>

        {/* Muscle Recovery Status */}
        <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            Muscle Recovery Status
          </h3>
          <div className="space-y-3">
            {muscleStats.map((muscle) => (
              <div key={muscle.value} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${muscle.color}`} />
                <span className="flex-1 text-sm font-medium">{muscle.label}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  muscle.status === 'recovered' ? 'bg-accent/20 text-accent' :
                  muscle.status === 'recovering' ? 'bg-warning/20 text-warning' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {muscle.status === 'fresh' ? 'Not trained' : 
                   muscle.status === 'recovered' ? `Recovered (${muscle.daysSince}d)` :
                   `Recovering (${muscle.daysSince}d)`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Workouts */}
        {workouts && workouts.length > 0 && (
          <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h3 className="font-semibold mb-4">Recent Workouts</h3>
            <div className="space-y-3">
              {workouts.slice(0, 5).map((workout) => (
                <div 
                  key={workout.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {new Date(workout.workout_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    {workout.notes && (
                      <p className="text-xs text-muted-foreground">{workout.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {workout.total_duration_minutes && (
                      <p className="text-sm text-primary">{workout.total_duration_minutes} min</p>
                    )}
                    {workout.calories_burned && (
                      <p className="text-xs text-muted-foreground">{workout.calories_burned} kcal</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goals Progress */}
        <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="font-semibold mb-4">Your Goal</h3>
          <div className="text-center py-4">
            <p className="text-4xl font-bold text-gradient capitalize">
              {profile?.fitness_goal?.replace('_', ' ') || 'Not Set'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {profile?.fitness_goal === 'muscle_gain' && 'Focus on progressive overload and high protein diet'}
              {profile?.fitness_goal === 'fat_loss' && 'Maintain calorie deficit and include cardio'}
              {profile?.fitness_goal === 'strength' && 'Heavy compound lifts with adequate rest'}
              {profile?.fitness_goal === 'maintenance' && 'Consistent training and balanced nutrition'}
              {!profile?.fitness_goal && 'Set your fitness goal in profile settings'}
            </p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
