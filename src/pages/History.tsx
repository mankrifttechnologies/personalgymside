import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWorkouts } from '@/hooks/useWorkouts';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { MUSCLE_GROUPS } from '@/types/fitness';
import { 
  Calendar, ChevronLeft, ChevronRight, Dumbbell, Flame, Loader2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

export default function History() {
  const { user, loading: authLoading } = useAuth();
  const { workouts, isLoading } = useWorkouts();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-glow p-4 rounded-full bg-primary/20">
          <Calendar className="w-8 h-8 text-primary animate-float" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week for the first day (0 = Sunday)
  const startDay = monthStart.getDay();

  // Create padding for days before the start of month
  const paddingDays = Array.from({ length: startDay }, (_, i) => null);

  const getWorkoutForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return workouts?.find(w => w.workout_date === dateStr);
  };

  const selectedWorkout = selectedDate ? getWorkoutForDate(selectedDate) : null;

  // Calculate monthly stats
  const monthWorkouts = workouts?.filter(w => {
    const workoutDate = new Date(w.workout_date);
    return isSameMonth(workoutDate, currentMonth);
  }) || [];

  const totalWorkoutsThisMonth = monthWorkouts.length;
  const totalCaloriesBurned = monthWorkouts.reduce((acc, w) => acc + (w.calories_burned || 0), 0);

  return (
    <div className="min-h-screen pb-24 safe-area-top">
      {/* Header */}
      <header className="p-4 flex items-center gap-3">
        <Link to="/progress">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Workout History</h1>
          <p className="text-sm text-muted-foreground">Calendar view</p>
        </div>
      </header>

      <main className="px-4 space-y-6">
        {/* Month Navigation */}
        <div className="glass rounded-xl p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, idx) => (
              <div key={`pad-${idx}`} className="aspect-square" />
            ))}
            {monthDays.map((day) => {
              const workout = getWorkoutForDate(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(workout ? day : null)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground scale-110'
                      : isToday
                        ? 'bg-accent/20 border border-accent'
                        : workout
                          ? 'bg-primary/20 hover:bg-primary/30'
                          : 'hover:bg-secondary'
                  }`}
                >
                  <span className={`text-sm font-medium ${
                    workout && !isSelected ? 'text-primary' : ''
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {workout && (
                    <div className="absolute bottom-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-xl p-4 animate-slide-up">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Workouts</span>
            </div>
            <p className="text-2xl font-bold">{totalWorkoutsThisMonth}</p>
          </div>
          <div className="glass rounded-xl p-4 animate-slide-up">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Calories</span>
            </div>
            <p className="text-2xl font-bold">{totalCaloriesBurned.toLocaleString()}</p>
          </div>
        </div>

        {/* Selected Workout Details */}
        {selectedWorkout && (
          <div className="glass rounded-xl p-4 animate-slide-up">
            <h3 className="font-semibold mb-3">
              {format(selectedDate!, 'EEEE, MMMM d, yyyy')}
            </h3>
            {selectedWorkout.notes && (
              <p className="text-sm text-muted-foreground mb-3">{selectedWorkout.notes}</p>
            )}
            <div className="flex gap-4 mb-4">
              {selectedWorkout.total_duration_minutes && (
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">{selectedWorkout.total_duration_minutes}</p>
                  <p className="text-xs text-muted-foreground">minutes</p>
                </div>
              )}
              {selectedWorkout.calories_burned && (
                <div className="text-center">
                  <p className="text-lg font-bold text-accent">{selectedWorkout.calories_burned}</p>
                  <p className="text-xs text-muted-foreground">kcal</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Workouts List */}
        <div className="glass rounded-xl p-4 animate-slide-up">
          <h3 className="font-semibold mb-4">Recent Workouts</h3>
          <div className="space-y-2">
            {workouts?.slice(0, 10).map((workout) => (
              <button
                key={workout.id}
                onClick={() => {
                  setSelectedDate(new Date(workout.workout_date));
                  setCurrentMonth(new Date(workout.workout_date));
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-sm">
                    {format(new Date(workout.workout_date), 'EEE, MMM d')}
                  </p>
                  {workout.notes && (
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {workout.notes}
                    </p>
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
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
