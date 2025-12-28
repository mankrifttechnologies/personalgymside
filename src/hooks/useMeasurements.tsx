import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface BodyMeasurement {
  id: string;
  user_id: string;
  measurement_date: string;
  weight_kg: number | null;
  body_fat_percentage: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  biceps_cm: number | null;
  thighs_cm: number | null;
  notes: string | null;
  created_at: string;
}

export function useMeasurements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: measurements, isLoading } = useQuery({
    queryKey: ['measurements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', user.id)
        .order('measurement_date', { ascending: false });

      if (error) throw error;
      return data as BodyMeasurement[];
    },
    enabled: !!user?.id,
  });

  const addMeasurement = useMutation({
    mutationFn: async (measurement: Omit<BodyMeasurement, 'id' | 'user_id' | 'created_at'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('body_measurements')
        .insert({
          user_id: user.id,
          ...measurement,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements', user?.id] });
    },
  });

  const deleteMeasurement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('body_measurements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements', user?.id] });
    },
  });

  // Get weight progress data for charts
  const getWeightProgress = () => {
    if (!measurements) return [];
    return measurements
      .filter(m => m.weight_kg !== null)
      .map(m => ({
        date: m.measurement_date,
        weight: m.weight_kg,
      }))
      .reverse();
  };

  // Get latest measurement
  const getLatestMeasurement = (): BodyMeasurement | undefined => {
    return measurements?.[0];
  };

  // Calculate weight change
  const getWeightChange = (): { change: number; period: string } | null => {
    if (!measurements || measurements.length < 2) return null;
    
    const validMeasurements = measurements.filter(m => m.weight_kg !== null);
    if (validMeasurements.length < 2) return null;

    const latest = validMeasurements[0].weight_kg!;
    const oldest = validMeasurements[validMeasurements.length - 1].weight_kg!;
    const daysDiff = Math.floor(
      (new Date(validMeasurements[0].measurement_date).getTime() - 
       new Date(validMeasurements[validMeasurements.length - 1].measurement_date).getTime()) / 
      (1000 * 60 * 60 * 24)
    );

    return {
      change: Number((latest - oldest).toFixed(1)),
      period: `${daysDiff} days`,
    };
  };

  return {
    measurements,
    isLoading,
    addMeasurement,
    deleteMeasurement,
    getWeightProgress,
    getLatestMeasurement,
    getWeightChange,
  };
}
