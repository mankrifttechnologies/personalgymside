import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Brain, Loader2, Play, Plus, Minus, Check, RefreshCw, Dumbbell, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useXP } from '@/hooks/useXP';
import BottomNav from '@/components/BottomNav';
import ExerciseDemoSheet from '@/components/ExerciseDemoSheet';
import { MUSCLE_GROUPS, MuscleGroup } from '@/types/fitness';

interface RoutineExercise {
  exercise_name: string;
  muscle_group: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
  rest_seconds: number;
  notes?: string;
  // tracking state
  setsLogged: { reps: number; weight: number; done: boolean }[];
  completed: boolean;
}

const storageKey = (uid: string) => `daily-routine:${uid}:${new Date().toISOString().split('T')[0]}`;

export default function DailyRoutine() {
  const { user, loading: authLoading } = useAuth();
  const { createWorkout, addExercise } = useWorkouts();
  const { addXP } = useXP();

  const [routine, setRoutine] = useState<RoutineExercise[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [demoExercise, setDemoExercise] = useState<string | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);

  // Load cached routine for today
  useEffect(() => {
    if (!user) return;
    const cached = localStorage.getItem(storageKey(user.id));
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setRoutine(parsed.routine || null);
        setFinished(!!parsed.finished);
      } catch {}
    }
  }, [user]);

  // Persist routine
  useEffect(() => {
    if (!user || !routine) return;
    localStorage.setItem(storageKey(user.id), JSON.stringify({ routine, finished }));
  }, [routine, finished, user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const generate = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('smart-workout-builder');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const exercises: RoutineExercise[] = (data.exercises || []).map((e: any) => ({
        exercise_name: e.exercise_name,
        muscle_group: e.muscle_group,
        sets: e.sets || 3,
        reps: e.reps || 10,
        weight_kg: e.weight_kg ?? null,
        rest_seconds: e.rest_seconds || 60,
        notes: e.notes,
        setsLogged: Array.from({ length: e.sets || 3 }, () => ({
          reps: e.reps || 10,
          weight: e.weight_kg ?? 0,
          done: false,
        })),
        completed: false,
      }));
      if (!exercises.length) {
        toast.info('No routine generated. Try again later.');
      } else {
        toast.success('Today\'s routine is ready!');
      }
      setRoutine(exercises);
      setFinished(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate routine');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSet = (exIdx: number, setIdx: number, field: 'reps' | 'weight', val: number) => {
    setRoutine(prev => prev && prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      const setsLogged = ex.setsLogged.map((s, si) => si === setIdx ? { ...s, [field]: val } : s);
      return { ...ex, setsLogged };
    }));
  };

  const toggleSetDone = (exIdx: number, setIdx: number) => {
    setRoutine(prev => prev && prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      const setsLogged = ex.setsLogged.map((s, si) => si === setIdx ? { ...s, done: !s.done } : s);
      const allDone = setsLogged.every(s => s.done);
      return { ...ex, setsLogged, completed: allDone };
    }));
  };

  const markExerciseComplete = (exIdx: number) => {
    setRoutine(prev => prev && prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      const setsLogged = ex.setsLogged.map(s => ({ ...s, done: true }));
      return { ...ex, setsLogged, completed: true };
    }));
  };

  const openDemo = (name: string) => {
    setDemoExercise(name);
    setDemoOpen(true);
  };

  const completedCount = routine?.filter(e => e.completed).length || 0;
  const totalCount = routine?.length || 0;
  const progressPct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const finishWorkout = async () => {
    if (!routine || saving) return;
    if (completedCount === 0) {
      toast.error('Complete at least one exercise first');
      return;
    }
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const workout = await createWorkout.mutateAsync({ date: today, notes: 'Daily AI routine' });
      // Insert each completed exercise
      for (const ex of routine.filter(e => e.completed)) {
        const avgReps = Math.round(
          ex.setsLogged.reduce((s, x) => s + (x.reps || 0), 0) / Math.max(ex.setsLogged.length, 1)
        );
        const avgWeight = ex.setsLogged.reduce((s, x) => s + (x.weight || 0), 0) / Math.max(ex.setsLogged.length, 1);
        await addExercise.mutateAsync({
          workout_id: workout.id,
          muscle_group: ex.muscle_group as MuscleGroup,
          exercise_name: ex.exercise_name,
          sets: ex.setsLogged.length,
          reps: avgReps || ex.reps,
          weight_kg: avgWeight > 0 ? avgWeight : null,
        });
      }
      try { await awardXP(50, 'Completed daily routine'); } catch {}
      setFinished(true);
      toast.success('Workout completed! +50 XP');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save workout');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 glass border-b border-border/40">
        <div className="flex items-center gap-3 p-4">
          <Link to="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Daily Routine</h1>
            <p className="text-xs text-muted-foreground">AI-built workout · no trainer needed</p>
          </div>
          {routine && (
            <Button variant="ghost" size="icon" onClick={generate} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
        {routine && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{completedCount}/{totalCount} done</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </header>

      <main className="p-4 space-y-4">
        {/* Empty / generate state */}
        {!routine && (
          <div className="glass-card p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Your personal workout, every day</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Get a fresh routine tailored to your recovery and goals. View video demos,
                track sets &amp; reps, and mark it complete.
              </p>
            </div>
            <Button variant="energy" className="w-full gap-2" onClick={generate} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {isLoading ? 'Building your routine...' : "Generate Today's Routine"}
            </Button>
          </div>
        )}

        {isLoading && routine && (
          <div className="flex items-center justify-center py-6 gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Building a fresh routine...
          </div>
        )}

        {/* Routine list */}
        {routine && routine.map((ex, exIdx) => {
          const muscle = MUSCLE_GROUPS.find(m => m.value === ex.muscle_group);
          return (
            <div
              key={exIdx}
              className={`glass-card p-4 space-y-3 transition-all ${ex.completed ? 'opacity-70' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-1.5 self-stretch rounded-full ${muscle?.color || 'bg-primary'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{ex.exercise_name}</h3>
                    {ex.completed && <CheckCircle2 className="w-4 h-4 text-accent" />}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {ex.muscle_group} · {ex.sets}×{ex.reps}
                    {ex.weight_kg ? ` @ ${ex.weight_kg}kg` : ''} · {ex.rest_seconds}s rest
                  </p>
                  {ex.notes && (
                    <p className="text-[11px] text-muted-foreground/80 mt-1">{ex.notes}</p>
                  )}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => openDemo(ex.exercise_name)}
                >
                  <Play className="w-3.5 h-3.5" /> Demo
                </Button>
              </div>

              {/* Sets tracker */}
              <div className="space-y-1.5">
                <div className="grid grid-cols-[28px_1fr_1fr_40px] gap-2 text-[10px] uppercase tracking-wide text-muted-foreground px-1">
                  <span>Set</span>
                  <span>Weight (kg)</span>
                  <span>Reps</span>
                  <span className="text-right">Done</span>
                </div>
                {ex.setsLogged.map((s, si) => (
                  <div
                    key={si}
                    className={`grid grid-cols-[28px_1fr_1fr_40px] gap-2 items-center rounded-lg p-1.5 ${
                      s.done ? 'bg-accent/10' : 'bg-secondary/40'
                    }`}
                  >
                    <span className="text-sm font-bold text-center">{si + 1}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => updateSet(exIdx, si, 'weight', Math.max(0, s.weight - 2.5))}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={s.weight}
                        onChange={e => updateSet(exIdx, si, 'weight', Number(e.target.value) || 0)}
                        className="h-8 text-center px-1"
                      />
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => updateSet(exIdx, si, 'weight', s.weight + 2.5)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => updateSet(exIdx, si, 'reps', Math.max(0, s.reps - 1))}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={s.reps}
                        onChange={e => updateSet(exIdx, si, 'reps', Number(e.target.value) || 0)}
                        className="h-8 text-center px-1"
                      />
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => updateSet(exIdx, si, 'reps', s.reps + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant={s.done ? 'default' : 'outline'}
                      size="icon"
                      className="h-8 w-8 justify-self-end"
                      onClick={() => toggleSetDone(exIdx, si)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {!ex.completed && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => markExerciseComplete(exIdx)}
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark exercise complete
                </Button>
              )}
            </div>
          );
        })}

        {/* Finish */}
        {routine && routine.length > 0 && (
          <div className="sticky bottom-24 z-10">
            {finished ? (
              <div className="glass-card p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="font-semibold">Workout saved for today</p>
                <p className="text-xs text-muted-foreground">Great job! Come back tomorrow for a new routine.</p>
              </div>
            ) : (
              <Button
                variant="energy"
                className="w-full h-12 gap-2 shadow-lg"
                onClick={finishWorkout}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Dumbbell className="w-5 h-5" />}
                {saving ? 'Saving workout...' : `Mark Workout Complete (${completedCount}/${totalCount})`}
              </Button>
            )}
          </div>
        )}
      </main>

      <ExerciseDemoSheet
        exerciseName={demoExercise}
        open={demoOpen}
        onOpenChange={setDemoOpen}
      />

      <BottomNav />
    </div>
  );
}
