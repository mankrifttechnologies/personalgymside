import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useCallback } from 'react';

export interface MobilityExercise {
  name: string;
  duration_seconds: number;
  description: string;
  image_hint?: string;
}

// Built-in routines (no DB needed for these)
const BUILT_IN_ROUTINES = [
  {
    id: 'warmup-full',
    title: 'Full Body Warm-Up',
    description: 'Dynamic stretches to prep your entire body',
    routine_type: 'warmup',
    target_area: 'full_body',
    duration_minutes: 8,
    is_system: true,
    exercises: [
      { name: 'Arm Circles', duration_seconds: 30, description: 'Large circles forward then backward' },
      { name: 'Leg Swings', duration_seconds: 30, description: 'Front-to-back leg swings, each side' },
      { name: 'Hip Circles', duration_seconds: 30, description: 'Large hip rotations both directions' },
      { name: 'Cat-Cow Stretch', duration_seconds: 40, description: 'Alternate arching and rounding spine' },
      { name: 'Inchworms', duration_seconds: 45, description: 'Walk hands out to plank, walk back' },
      { name: 'World\'s Greatest Stretch', duration_seconds: 60, description: 'Lunge with rotation each side' },
      { name: 'High Knees', duration_seconds: 30, description: 'Quick high knees to warm up' },
      { name: 'Jumping Jacks', duration_seconds: 30, description: 'Classic jumping jacks' },
    ] as MobilityExercise[],
  },
  {
    id: 'warmup-upper',
    title: 'Upper Body Warm-Up',
    description: 'Prep your chest, shoulders, and back',
    routine_type: 'warmup',
    target_area: 'upper_body',
    duration_minutes: 6,
    is_system: true,
    exercises: [
      { name: 'Shoulder Rolls', duration_seconds: 30, description: 'Roll shoulders forward and back' },
      { name: 'Arm Crosses', duration_seconds: 30, description: 'Cross arms in front alternating' },
      { name: 'Band Pull-Aparts', duration_seconds: 30, description: 'Simulate with arms extended' },
      { name: 'Wall Angels', duration_seconds: 40, description: 'Slide arms up/down against wall' },
      { name: 'Thoracic Rotations', duration_seconds: 40, description: 'Rotate upper back each side' },
      { name: 'Push-Up to Downward Dog', duration_seconds: 45, description: 'Flow between positions' },
    ] as MobilityExercise[],
  },
  {
    id: 'warmup-lower',
    title: 'Lower Body Warm-Up',
    description: 'Activate legs, glutes, and hips',
    routine_type: 'warmup',
    target_area: 'lower_body',
    duration_minutes: 7,
    is_system: true,
    exercises: [
      { name: 'Bodyweight Squats', duration_seconds: 40, description: '10 slow controlled squats' },
      { name: 'Walking Lunges', duration_seconds: 40, description: '5 lunges each leg' },
      { name: 'Glute Bridges', duration_seconds: 40, description: '10 bridges with hold at top' },
      { name: 'Leg Swings (Side)', duration_seconds: 30, description: 'Side-to-side swings each leg' },
      { name: 'Ankle Circles', duration_seconds: 30, description: 'Rotate ankles both directions' },
      { name: 'Calf Raises', duration_seconds: 30, description: '15 slow calf raises' },
    ] as MobilityExercise[],
  },
  {
    id: 'cooldown-full',
    title: 'Full Body Cool-Down',
    description: 'Static stretches for recovery',
    routine_type: 'cooldown',
    target_area: 'full_body',
    duration_minutes: 10,
    is_system: true,
    exercises: [
      { name: 'Standing Quad Stretch', duration_seconds: 40, description: 'Hold each leg for 20s' },
      { name: 'Standing Hamstring Stretch', duration_seconds: 40, description: 'Reach for toes gently' },
      { name: 'Chest Doorway Stretch', duration_seconds: 40, description: 'Open chest with arms on doorway' },
      { name: 'Seated Spinal Twist', duration_seconds: 50, description: 'Twist each side and hold' },
      { name: 'Pigeon Pose', duration_seconds: 60, description: 'Deep hip opener each side' },
      { name: 'Child\'s Pose', duration_seconds: 45, description: 'Rest and breathe deeply' },
      { name: 'Neck Stretches', duration_seconds: 30, description: 'Tilt each direction gently' },
      { name: 'Deep Breathing', duration_seconds: 60, description: '5 deep breaths in and out' },
    ] as MobilityExercise[],
  },
  {
    id: 'mobility-hips',
    title: 'Hip Mobility Flow',
    description: 'Open up tight hips and improve range of motion',
    routine_type: 'mobility',
    target_area: 'hips',
    duration_minutes: 8,
    is_system: true,
    exercises: [
      { name: '90/90 Stretch', duration_seconds: 50, description: 'Switch between internal/external rotation' },
      { name: 'Frog Stretch', duration_seconds: 45, description: 'Wide knees, sink hips back' },
      { name: 'Hip Flexor Stretch', duration_seconds: 40, description: 'Half kneeling stretch each side' },
      { name: 'Cossack Squats', duration_seconds: 45, description: 'Side-to-side lateral squats' },
      { name: 'Butterfly Stretch', duration_seconds: 40, description: 'Feet together, press knees down' },
      { name: 'Happy Baby', duration_seconds: 40, description: 'On back, hold feet, rock side to side' },
    ] as MobilityExercise[],
  },
];

export function useMobilityRoutines() {
  const routinesQuery = useQuery({
    queryKey: ['mobility-routines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mobility_routines')
        .select('*')
        .eq('is_system', true);
      if (error) throw error;
      return data;
    },
  });

  // Combine DB routines with built-in ones
  const allRoutines = [...BUILT_IN_ROUTINES, ...(routinesQuery.data || []).map((r: any) => ({
    ...r,
    exercises: (r.exercises as MobilityExercise[]) || [],
  }))];

  return {
    routines: allRoutines,
    isLoading: routinesQuery.isLoading,
  };
}

export function useRoutineTimer(exercises: MobilityExercise[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const currentExercise = exercises[currentIndex];

  const start = useCallback(() => {
    setCurrentIndex(0);
    setTimeLeft(exercises[0]?.duration_seconds || 0);
    setIsRunning(true);
    setIsComplete(false);
  }, [exercises]);

  const pause = useCallback(() => setIsRunning(false), []);
  const resume = useCallback(() => setIsRunning(true), []);

  const skip = useCallback(() => {
    if (currentIndex < exercises.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      setTimeLeft(exercises[next].duration_seconds);
    } else {
      setIsRunning(false);
      setIsComplete(true);
    }
  }, [currentIndex, exercises]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Auto advance
          if (currentIndex < exercises.length - 1) {
            const next = currentIndex + 1;
            setCurrentIndex(next);
            return exercises[next].duration_seconds;
          } else {
            setIsRunning(false);
            setIsComplete(true);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, currentIndex, exercises]);

  const totalTime = exercises.reduce((sum, e) => sum + e.duration_seconds, 0);
  const elapsed = exercises.slice(0, currentIndex).reduce((sum, e) => sum + e.duration_seconds, 0) + (currentExercise ? currentExercise.duration_seconds - timeLeft : 0);
  const progress = totalTime > 0 ? (elapsed / totalTime) * 100 : 0;

  return {
    currentExercise,
    currentIndex,
    timeLeft,
    isRunning,
    isComplete,
    progress,
    totalExercises: exercises.length,
    start,
    pause,
    resume,
    skip,
  };
}
