import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface MealPlanMeal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface MealPlan {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  meals: MealPlanMeal[];
  created_at: string;
  updated_at: string;
}

export const useMealPlans = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: mealPlans = [], isLoading } = useQuery({
    queryKey: ['meal-plans', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(plan => ({
        ...plan,
        meals: (plan.meals as unknown as MealPlanMeal[]) || [],
      })) as MealPlan[];
    },
    enabled: !!user,
  });

  const createMealPlan = useMutation({
    mutationFn: async ({ name, description, meals }: { name: string; description?: string; meals: MealPlanMeal[] }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('meal_plans')
        .insert({ user_id: user.id, name, description, meals: meals as unknown as any })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plans'] });
    },
  });

  const updateMealPlan = useMutation({
    mutationFn: async ({ id, name, description, meals }: { id: string; name: string; description?: string; meals: MealPlanMeal[] }) => {
      const { data, error } = await supabase
        .from('meal_plans')
        .update({ name, description, meals: meals as unknown as any, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plans'] });
    },
  });

  const deleteMealPlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plans'] });
    },
  });

  return {
    mealPlans,
    isLoading,
    createMealPlan,
    updateMealPlan,
    deleteMealPlan,
  };
};
