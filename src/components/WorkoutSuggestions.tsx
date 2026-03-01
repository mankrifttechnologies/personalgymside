import { useMuscleRecovery } from '@/hooks/useWorkouts';
import { MUSCLE_GROUPS, EXERCISE_SUGGESTIONS, MuscleGroup } from '@/types/fitness';
import { Button } from '@/components/ui/button';
import { Play, ExternalLink, Zap } from 'lucide-react';

interface WorkoutSuggestionsProps {
  onSelectExercise: (muscle: MuscleGroup, exercise: string) => void;
}

const EXERCISE_THUMBNAILS: Record<string, string> = {
  'Bench Press': '🏋️',
  'Incline Dumbbell Press': '🏋️',
  'Cable Flyes': '🪢',
  'Push-ups': '💪',
  'Squats': '🦵',
  'Leg Press': '🦿',
  'Lunges': '🚶',
  'Leg Curls': '🦵',
  'Deadlifts': '🏋️',
  'Barbell Rows': '🏋️',
  'Pull-ups': '💪',
  'Lat Pulldown': '🪢',
  'Overhead Press': '🏋️',
  'Lateral Raises': '💪',
  'Face Pulls': '🪢',
  'Barbell Curls': '💪',
  'Hammer Curls': '💪',
  'Tricep Pushdowns': '🪢',
  'Skull Crushers': '🏋️',
  'Planks': '🧘',
  'Crunches': '🧘',
  'Russian Twists': '🔄',
};

function getYouTubeSearchUrl(exercise: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise + ' exercise tutorial proper form')}`;
}

export default function WorkoutSuggestions({ onSelectExercise }: WorkoutSuggestionsProps) {
  const { getRecoveryStatus } = useMuscleRecovery();

  // Get muscles sorted by recovery priority (fresh first, then recovered)
  const suggestedMuscles = MUSCLE_GROUPS
    .map(m => ({ ...m, recovery: getRecoveryStatus(m.value) }))
    .filter(m => m.recovery.status === 'fresh' || m.recovery.status === 'recovered')
    .sort((a, b) => {
      if (a.recovery.status === 'fresh' && b.recovery.status !== 'fresh') return -1;
      if (b.recovery.status === 'fresh' && a.recovery.status !== 'fresh') return 1;
      return b.recovery.days - a.recovery.days;
    })
    .slice(0, 3);

  if (suggestedMuscles.length === 0) {
    return (
      <div className="glass rounded-xl p-4 animate-slide-up">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Today's Suggestions</h3>
        </div>
        <p className="text-sm text-muted-foreground">All muscles are still recovering. Consider a rest day or light cardio! 🧘</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4 animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Suggested For You</h3>
      </div>

      <div className="space-y-4">
        {suggestedMuscles.map(muscle => {
          const exercises = EXERCISE_SUGGESTIONS[muscle.value].slice(0, 3);
          return (
            <div key={muscle.value}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${muscle.color}`} />
                <span className="text-sm font-medium">{muscle.label}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {muscle.recovery.status === 'fresh' ? '✨ Not trained yet' : `${muscle.recovery.days}d recovered`}
                </span>
              </div>
              <div className="grid gap-2">
                {exercises.map(exercise => (
                  <div
                    key={exercise}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">
                      {EXERCISE_THUMBNAILS[exercise] || '🏋️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{exercise}</p>
                      <p className="text-xs text-muted-foreground">3 × 10-12 reps</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <a
                        href={getYouTubeSearchUrl(exercise)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Play className="w-4 h-4 text-destructive" />
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onSelectExercise(muscle.value, exercise)}
                      >
                        <ExternalLink className="w-4 h-4 text-primary" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
