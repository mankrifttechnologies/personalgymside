import { useState } from 'react';
import { useProfile } from './useProfile';
import { useMuscleRecovery, useWorkouts } from './useWorkouts';
import { useCalories } from './useCalories';
import { MuscleGroup } from '@/types/fitness';

const AI_COACH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`;

export function useAICoach() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const { profile } = useProfile();
  const { muscleRecovery } = useMuscleRecovery();
  const { workouts } = useWorkouts();
  const { totals } = useCalories();

  const getWorkoutRecommendation = async () => {
    setIsLoading(true);
    setResponse('');
    setError(null);

    try {
      const recoveryData = muscleRecovery?.map((r) => {
        const lastTrained = new Date(r.last_trained_date);
        const today = new Date();
        const daysSince = Math.floor((today.getTime() - lastTrained.getTime()) / (1000 * 60 * 60 * 24));
        return { muscle_group: r.muscle_group, days_since: daysSince };
      }) || [];

      const recentWorkoutsData = workouts?.slice(0, 5).map(w => ({
        date: w.workout_date,
        muscles: [] as MuscleGroup[],
      })) || [];

      const resp = await fetch(AI_COACH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: 'workout_recommendation',
          profile,
          muscleRecovery: recoveryData,
          recentWorkouts: recentWorkoutsData,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Failed to get recommendation');
      }

      await streamResponse(resp);
    } catch (err) {
      console.error('Error getting workout recommendation:', err);
      setError(err instanceof Error ? err.message : 'Failed to get recommendation');
    } finally {
      setIsLoading(false);
    }
  };

  const getDietRecommendation = async () => {
    setIsLoading(true);
    setResponse('');
    setError(null);

    try {
      const resp = await fetch(AI_COACH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: 'diet_recommendation',
          profile,
          todayCalories: totals,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Failed to get recommendation');
      }

      await streamResponse(resp);
    } catch (err) {
      console.error('Error getting diet recommendation:', err);
      setError(err instanceof Error ? err.message : 'Failed to get recommendation');
    } finally {
      setIsLoading(false);
    }
  };

  const streamResponse = async (resp: Response) => {
    if (!resp.body) throw new Error('No response body');

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullResponse += content;
            setResponse(fullResponse);
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }
  };

  return {
    isLoading,
    response,
    error,
    getWorkoutRecommendation,
    getDietRecommendation,
  };
}
