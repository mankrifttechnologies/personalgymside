import { Navigate, Link } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { usePersonalRecords } from '@/hooks/usePersonalRecords';
import { Button } from '@/components/ui/button';
import { MUSCLE_GROUPS } from '@/types/fitness';
import { 
  Trophy, ChevronLeft, Medal, Crown,
  Activity, Dumbbell, Utensils, User, Plus
} from 'lucide-react';

export default function Records() {
  const { user, loading: authLoading } = useAuth();
  const { records, isLoading } = usePersonalRecords();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-glow p-4 rounded-full bg-primary/20">
          <Trophy className="w-8 h-8 text-primary animate-float" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Group records by muscle group
  const recordsByMuscle = MUSCLE_GROUPS.map(muscle => ({
    ...muscle,
    records: records?.filter(r => r.muscle_group === muscle.value) || [],
  }));

  const topRecords = records?.slice(0, 3) || [];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="p-4 flex items-center gap-3">
        <Link to="/progress">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Personal Records</h1>
          <p className="text-sm text-muted-foreground">Your all-time bests</p>
        </div>
      </header>

      <main className="px-4 space-y-6">
        {/* Top 3 PRs */}
        {topRecords.length > 0 && (
          <div className="glass rounded-xl p-4 animate-slide-up">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-warning" />
              Top Lifts
            </h3>
            <div className="space-y-3">
              {topRecords.map((record, index) => (
                <div 
                  key={record.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-warning text-warning-foreground' :
                    index === 1 ? 'bg-muted text-muted-foreground' :
                    'bg-primary/20 text-primary'
                  }`}>
                    {index === 0 ? <Crown className="w-5 h-5" /> :
                     index === 1 ? <Medal className="w-5 h-5" /> :
                     <Trophy className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{record.exercise_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{record.muscle_group}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{record.max_weight_kg} kg</p>
                    <p className="text-xs text-muted-foreground">{record.max_reps} reps</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRs by Muscle Group */}
        {recordsByMuscle.map((muscle, idx) => {
          if (muscle.records.length === 0) return null;
          
          return (
            <div 
              key={muscle.value}
              className="glass rounded-xl p-4 animate-slide-up"
              style={{ animationDelay: `${0.1 * (idx + 1)}s` }}
            >
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${muscle.color}`} />
                {muscle.label}
              </h3>
              <div className="space-y-2">
                {muscle.records.map((record) => (
                  <div 
                    key={record.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="font-medium text-sm">{record.exercise_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(record.achieved_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{record.max_weight_kg} kg</p>
                      <p className="text-xs text-muted-foreground">× {record.max_reps}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {(!records || records.length === 0) && !isLoading && (
          <div className="glass rounded-xl p-8 text-center animate-slide-up">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Personal Records Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Log your workouts to start tracking your PRs automatically!
            </p>
            <Link to="/workout">
              <Button variant="energy">Start Workout</Button>
            </Link>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
