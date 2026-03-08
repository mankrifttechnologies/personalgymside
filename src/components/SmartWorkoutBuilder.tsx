import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Brain, Loader2, Dumbbell, RefreshCw, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { MUSCLE_GROUPS } from '@/types/fitness';

interface GeneratedExercise {
  exercise_name: string;
  muscle_group: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
  rest_seconds: number;
  notes: string;
}

interface SmartWorkoutBuilderProps {
  onAddExercise: (muscle: string, exercise: string, sets: number, reps: number, weight: number | null) => void;
}

export default function SmartWorkoutBuilder({ onAddExercise }: SmartWorkoutBuilderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [exercises, setExercises] = useState<GeneratedExercise[]>([]);
  const [addedIndexes, setAddedIndexes] = useState<Set<number>>(new Set());

  const generateWorkout = async () => {
    setIsLoading(true);
    setExercises([]);
    setAddedIndexes(new Set());

    try {
      const { data, error } = await supabase.functions.invoke('smart-workout-builder');

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setExercises(data.exercises || []);
      if (!data.exercises?.length) {
        toast.info('No workout generated. Try logging more exercises first.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate workout');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExercise = (exercise: GeneratedExercise, index: number) => {
    onAddExercise(
      exercise.muscle_group,
      exercise.exercise_name,
      exercise.sets,
      exercise.reps,
      exercise.weight_kg
    );
    setAddedIndexes(prev => new Set([...prev, index]));
    toast.success(`Added ${exercise.exercise_name}`);
  };

  const handleAddAll = () => {
    exercises.forEach((ex, i) => {
      if (!addedIndexes.has(i)) {
        handleAddExercise(ex, i);
      }
    });
  };

  return (
    <div className="glass rounded-xl p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Smart Workout Builder
        </h3>
        {exercises.length > 0 && (
          <Button variant="ghost" size="sm" onClick={generateWorkout} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      {!exercises.length && !isLoading && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            AI analyzes your recovery, history & goals to build the perfect workout.
          </p>
          <Button variant="energy" className="w-full gap-2" onClick={generateWorkout}>
            <Brain className="w-4 h-4" />
            Generate Today's Workout
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center py-6 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Building your workout...</p>
        </div>
      )}

      {exercises.length > 0 && (
        <div className="space-y-2">
          {exercises.map((ex, i) => {
            const muscle = MUSCLE_GROUPS.find(m => m.value === ex.muscle_group);
            const isAdded = addedIndexes.has(i);

            return (
              <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg ${isAdded ? 'bg-accent/10 border border-accent/30' : 'bg-secondary/50'}`}>
                <div className={`w-1.5 h-10 rounded-full ${muscle?.color || 'bg-primary'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{ex.exercise_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ex.sets}×{ex.reps} {ex.weight_kg ? `@ ${ex.weight_kg}kg` : ''}
                    {ex.rest_seconds ? ` · ${ex.rest_seconds}s rest` : ''}
                  </p>
                  {ex.notes && (
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">{ex.notes}</p>
                  )}
                </div>
                <Button
                  variant={isAdded ? 'ghost' : 'secondary'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleAddExercise(ex, i)}
                  disabled={isAdded}
                >
                  {isAdded ? '✓' : <Plus className="w-4 h-4" />}
                </Button>
              </div>
            );
          })}

          {addedIndexes.size < exercises.length && (
            <Button variant="energy" className="w-full mt-2 gap-2" onClick={handleAddAll}>
              <Dumbbell className="w-4 h-4" />
              Add All to Workout
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
