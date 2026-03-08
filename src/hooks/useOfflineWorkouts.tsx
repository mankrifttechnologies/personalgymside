import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface OfflineExercise {
  id: string;
  muscle_group: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
  timestamp: number;
}

interface OfflineWorkout {
  date: string;
  exercises: OfflineExercise[];
  synced: boolean;
}

const STORAGE_KEY = 'offline_workouts';

function getOfflineWorkouts(): OfflineWorkout[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveOfflineWorkouts(workouts: OfflineWorkout[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

export function useOfflineWorkouts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Count pending workouts
  useEffect(() => {
    const workouts = getOfflineWorkouts();
    const count = workouts.filter(w => !w.synced).reduce((acc, w) => acc + w.exercises.length, 0);
    setPendingCount(count);
  }, []);

  // Save exercise offline
  const saveExerciseOffline = useCallback((exercise: Omit<OfflineExercise, 'id' | 'timestamp'>) => {
    const workouts = getOfflineWorkouts();
    const today = new Date().toISOString().split('T')[0];
    
    let todayWorkout = workouts.find(w => w.date === today && !w.synced);
    if (!todayWorkout) {
      todayWorkout = { date: today, exercises: [], synced: false };
      workouts.push(todayWorkout);
    }

    todayWorkout.exercises.push({
      ...exercise,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    });

    saveOfflineWorkouts(workouts);
    setPendingCount(prev => prev + 1);
    toast.success('Saved offline — will sync when online');
  }, []);

  // Sync all pending workouts
  const syncWorkouts = useCallback(async () => {
    if (!user?.id || isSyncing) return;

    const workouts = getOfflineWorkouts();
    const pending = workouts.filter(w => !w.synced);
    if (pending.length === 0) return;

    setIsSyncing(true);
    let syncedCount = 0;

    try {
      for (const workout of pending) {
        // Get or create workout for that date
        let workoutId: string;
        const { data: existing } = await supabase
          .from('workouts')
          .select('id')
          .eq('user_id', user.id)
          .eq('workout_date', workout.date)
          .maybeSingle();

        if (existing) {
          workoutId = existing.id;
        } else {
          const { data: created, error } = await supabase
            .from('workouts')
            .insert({ user_id: user.id, workout_date: workout.date })
            .select('id')
            .single();
          if (error) throw error;
          workoutId = created.id;
        }

        // Insert all exercises
        const exerciseRows = workout.exercises.map(ex => ({
          workout_id: workoutId,
          muscle_group: ex.muscle_group,
          exercise_name: ex.exercise_name,
          sets: ex.sets,
          reps: ex.reps,
          weight_kg: ex.weight_kg,
        }));

        const { error } = await supabase.from('workout_exercises').insert(exerciseRows);
        if (error) throw error;

        // Update muscle recovery for each unique muscle group
        const muscleGroups = [...new Set(workout.exercises.map(e => e.muscle_group))];
        for (const mg of muscleGroups) {
          await supabase.from('muscle_recovery').upsert({
            user_id: user.id,
            muscle_group: mg,
            last_trained_date: workout.date,
          }, { onConflict: 'user_id,muscle_group' });
        }

        workout.synced = true;
        syncedCount += workout.exercises.length;
      }

      saveOfflineWorkouts(workouts.filter(w => !w.synced));
      setPendingCount(0);

      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['todayWorkout'] });
      queryClient.invalidateQueries({ queryKey: ['muscleRecovery'] });

      if (syncedCount > 0) {
        toast.success(`Synced ${syncedCount} offline exercise${syncedCount > 1 ? 's' : ''}!`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync some workouts. Will retry when online.');
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id, isSyncing, queryClient]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0 && user?.id) {
      syncWorkouts();
    }
  }, [isOnline, pendingCount, user?.id, syncWorkouts]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    saveExerciseOffline,
    syncWorkouts,
    getOfflineExercises: () => {
      const workouts = getOfflineWorkouts();
      return workouts.filter(w => !w.synced).flatMap(w => w.exercises);
    },
  };
}
