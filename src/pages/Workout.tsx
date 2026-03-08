import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWorkouts, useMuscleRecovery } from '@/hooks/useWorkouts';
import { useAICoach } from '@/hooks/useAICoach';
import { usePersonalRecords } from '@/hooks/usePersonalRecords';
import { useXP } from '@/hooks/useXP';
import { useBadges } from '@/hooks/useBadges';
import { useOfflineWorkouts } from '@/hooks/useOfflineWorkouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MUSCLE_GROUPS, EXERCISE_SUGGESTIONS, MuscleGroup } from '@/types/fitness';
import RestTimer from '@/components/RestTimer';
import ExerciseLibrary from '@/components/ExerciseLibrary';
import WorkoutSuggestions from '@/components/WorkoutSuggestions';
import SmartWorkoutBuilder from '@/components/SmartWorkoutBuilder';
import OfflineIndicator from '@/components/OfflineIndicator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Dumbbell, Plus, Check, ChevronLeft, Sparkles, 
  Activity, Utensils, User, Loader2, X, Layers, Trophy, Clock, BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

export default function Workout() {
  const { user, loading: authLoading } = useAuth();
  const { todayWorkout, createWorkout, addExercise } = useWorkouts();
  const { getRecoveryStatus } = useMuscleRecovery();
  const { isLoading: aiLoading, response: aiResponse, error: aiError, getWorkoutRecommendation } = useAICoach();
  const { checkAndUpdatePR, getPRForExercise } = usePersonalRecords();
  const { addXP } = useXP();
  const { awardBadge, hasBadge, earnedBadges } = useBadges();
  
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [customExercise, setCustomExercise] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState<number | ''>('');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-glow p-4 rounded-full bg-primary/20">
          <Dumbbell className="w-8 h-8 text-primary animate-float" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleAddExercise = async () => {
    if (!selectedMuscle) {
      toast.error('Please select a muscle group');
      return;
    }

    const exerciseName = customExercise || selectedExercise;
    if (!exerciseName) {
      toast.error('Please select or enter an exercise');
      return;
    }

    try {
      let workoutId = todayWorkout?.id;
      
      if (!workoutId) {
        const today = new Date().toISOString().split('T')[0];
        const workout = await createWorkout.mutateAsync({ date: today });
        workoutId = workout.id;
      }

      await addExercise.mutateAsync({
        workout_id: workoutId,
        muscle_group: selectedMuscle,
        exercise_name: exerciseName,
        sets,
        reps,
        weight_kg: weight || null,
      });

      // Check for new PR if weight is provided
      if (weight && typeof weight === 'number') {
        const prResult = await checkAndUpdatePR.mutateAsync({
          exerciseName,
          muscleGroup: selectedMuscle,
          weight,
          reps,
        });
        
        if (prResult.isNewPR) {
          toast.success(`🏆 New PR! ${exerciseName}: ${weight}kg × ${reps}`);
          // Award first PR badge
          if (!hasBadge('first_pr')) {
            await awardBadge.mutateAsync('first_pr');
            toast.success('🥇 Badge Earned: New Record!');
          }
        } else {
          toast.success(`Added ${exerciseName}!`);
        }
      } else {
        toast.success(`Added ${exerciseName}!`);
      }

      // Award XP for adding exercise
      await addXP.mutateAsync(10);

      // Check for first workout badge
      if (!hasBadge('first_workout')) {
        await awardBadge.mutateAsync('first_workout');
        toast.success('🎯 Badge Earned: First Steps!');
      }

      // Show rest timer
      setShowRestTimer(true);
      
      // Reset form
      setSelectedExercise('');
      setCustomExercise('');
      setSets(3);
      setReps(10);
      setWeight('');
    } catch (error) {
      toast.error('Failed to add exercise');
      console.error(error);
    }
  };

  const exercises = todayWorkout?.workout_exercises || [];

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
          <h1 className="text-xl font-bold">Log Workout</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/templates">
            <Button variant="glass" size="sm" className="gap-1">
              <Layers className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/records">
            <Button variant="glass" size="sm" className="gap-1">
              <Trophy className="w-4 h-4" />
            </Button>
          </Link>
          <Dialog open={showExerciseLibrary} onOpenChange={setShowExerciseLibrary}>
            <DialogTrigger asChild>
              <Button variant="glass" size="sm" className="gap-1">
                <BookOpen className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Exercise Library</DialogTitle>
              </DialogHeader>
              <ExerciseLibrary 
                onSelectExercise={(ex) => {
                  setSelectedMuscle(ex.muscle_group as MuscleGroup);
                  setSelectedExercise(ex.name);
                  setCustomExercise('');
                  setShowExerciseLibrary(false);
                }}
              />
            </DialogContent>
          </Dialog>
          <Button 
            variant="glass" 
            size="sm" 
            onClick={() => setShowAIPanel(!showAIPanel)}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="px-4 space-y-6">
        {/* AI Panel */}
        {showAIPanel && (
          <div className="glass rounded-xl p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Workout Recommendation
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAIPanel(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {!aiResponse && !aiLoading && (
              <Button 
                variant="energy" 
                className="w-full" 
                onClick={getWorkoutRecommendation}
              >
                Get Personalized Workout
              </Button>
            )}
            
            {aiLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating recommendation...
              </div>
            )}
            
            {aiError && (
              <p className="text-destructive text-sm">{aiError}</p>
            )}
            
            {aiResponse && (
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm">{aiResponse}</div>
              </div>
            )}
          </div>
        )}

        {/* Smart Workout Builder */}
        <SmartWorkoutBuilder
          onAddExercise={(muscle, exercise, sets, reps, weight) => {
            setSelectedMuscle(muscle as any);
            setSelectedExercise(exercise);
            setCustomExercise('');
            setSets(sets);
            setReps(reps);
            setWeight(weight || '');
          }}
        />

        {/* Smart Workout Suggestions */}
        <WorkoutSuggestions
          onSelectExercise={(muscle, exercise) => {
            setSelectedMuscle(muscle);
            setSelectedExercise(exercise);
            setCustomExercise('');
          }}
        />

        {/* Muscle Group Selection */}
        <div className="glass rounded-xl p-4 animate-slide-up">
          <h3 className="font-semibold mb-3">Select Muscle Group</h3>
          <div className="grid grid-cols-4 gap-2">
            {MUSCLE_GROUPS.map((muscle) => {
              const status = getRecoveryStatus(muscle.value);
              const isRecovered = status.status === 'recovered' || status.status === 'fresh';
              
              return (
                <button
                  key={muscle.value}
                  onClick={() => setSelectedMuscle(muscle.value)}
                  className={`relative p-3 rounded-xl text-center transition-all ${
                    selectedMuscle === muscle.value
                      ? `${muscle.color} text-white scale-105`
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  <p className="text-xs font-medium">{muscle.label}</p>
                  <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                    isRecovered ? 'bg-accent' : 'bg-warning'
                  }`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Exercise Selection */}
        {selectedMuscle && (
          <div className="glass rounded-xl p-4 animate-slide-up">
            <h3 className="font-semibold mb-3">Select Exercise</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {EXERCISE_SUGGESTIONS[selectedMuscle].map((exercise) => (
                <button
                  key={exercise}
                  onClick={() => {
                    setSelectedExercise(exercise);
                    setCustomExercise('');
                  }}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedExercise === exercise
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {exercise}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Or enter custom exercise..."
                value={customExercise}
                onChange={(e) => {
                  setCustomExercise(e.target.value);
                  setSelectedExercise('');
                }}
              />
            </div>
          </div>
        )}

        {/* Sets, Reps, Weight */}
        {(selectedExercise || customExercise) && (
          <div className="glass rounded-xl p-4 animate-slide-up">
            <h3 className="font-semibold mb-3">Exercise Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Sets</label>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="secondary" 
                    size="icon"
                    onClick={() => setSets(Math.max(1, sets - 1))}
                  >
                    -
                  </Button>
                  <span className="text-xl font-bold w-8 text-center">{sets}</span>
                  <Button 
                    variant="secondary" 
                    size="icon"
                    onClick={() => setSets(sets + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Reps</label>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="secondary" 
                    size="icon"
                    onClick={() => setReps(Math.max(1, reps - 1))}
                  >
                    -
                  </Button>
                  <span className="text-xl font-bold w-8 text-center">{reps}</span>
                  <Button 
                    variant="secondary" 
                    size="icon"
                    onClick={() => setReps(reps + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Weight (kg)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                  className="text-center"
                />
              </div>
            </div>
            
            <Button 
              variant="energy" 
              className="w-full mt-4" 
              onClick={handleAddExercise}
              disabled={addExercise.isPending}
            >
              {addExercise.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add Exercise
            </Button>
          </div>
        )}

        {/* Rest Timer */}
        {showRestTimer && (
          <RestTimer 
            defaultSeconds={90} 
            onComplete={() => {
              toast.success('Rest complete! Ready for next set.');
              setShowRestTimer(false);
            }} 
          />
        )}

        {/* Today's Exercises */}
        {exercises.length > 0 && (
          <div className="glass rounded-xl p-4 animate-slide-up">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-accent" />
              Today's Exercises ({exercises.length})
            </h3>
            <div className="space-y-2">
              {exercises.map((exercise: any) => {
                const muscleInfo = MUSCLE_GROUPS.find(m => m.value === exercise.muscle_group);
                return (
                  <div 
                    key={exercise.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${muscleInfo?.color || 'bg-primary'}`} />
                      <div>
                        <p className="font-medium">{exercise.exercise_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {exercise.sets} × {exercise.reps} {exercise.weight_kg && `@ ${exercise.weight_kg}kg`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted">
                      {muscleInfo?.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border px-4 py-3">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          <Link to="/" className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors">
            <Activity className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link to="/workout" className="flex flex-col items-center text-primary">
            <Dumbbell className="w-6 h-6" />
            <span className="text-xs mt-1">Workout</span>
          </Link>
          <Link to="/workout" className="relative -top-4">
            <Button variant="energy" size="icon" className="w-14 h-14 rounded-full shadow-lg">
              <Plus className="w-7 h-7" />
            </Button>
          </Link>
          <Link to="/nutrition" className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors">
            <Utensils className="w-6 h-6" />
            <span className="text-xs mt-1">Food</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors">
            <User className="w-6 h-6" />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
