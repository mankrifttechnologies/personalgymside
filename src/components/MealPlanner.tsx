import { useState } from 'react';
import { useMealPlans, MealPlanMeal } from '@/hooks/useMealPlans';
import { useCalories } from '@/hooks/useCalories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  UtensilsCrossed, Plus, Trash2, Play, ChevronDown, ChevronUp, 
  Loader2, Edit2 
} from 'lucide-react';
import { toast } from 'sonner';
import { MealType } from '@/types/fitness';

const MEAL_TYPES: { value: MealType; label: string; icon: string }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { value: 'lunch', label: 'Lunch', icon: '☀️' },
  { value: 'dinner', label: 'Dinner', icon: '🌙' },
  { value: 'snack', label: 'Snack', icon: '🍎' },
];

export default function MealPlanner() {
  const { mealPlans, isLoading, createMealPlan, deleteMealPlan } = useMealPlans();
  const { addEntry } = useCalories();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  
  // New plan form
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [meals, setMeals] = useState<MealPlanMeal[]>([]);
  
  // New meal form
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState<number | ''>('');
  const [mealProtein, setMealProtein] = useState<number | ''>('');
  const [mealCarbs, setMealCarbs] = useState<number | ''>('');
  const [mealFats, setMealFats] = useState<number | ''>('');
  const [mealType, setMealType] = useState<MealType>('breakfast');

  const addMealToPlan = () => {
    if (!mealName || !mealCalories) {
      toast.error('Please enter meal name and calories');
      return;
    }
    
    setMeals([...meals, {
      name: mealName,
      calories: mealCalories as number,
      protein: (mealProtein as number) || 0,
      carbs: (mealCarbs as number) || 0,
      fats: (mealFats as number) || 0,
      mealType,
    }]);
    
    // Reset
    setMealName('');
    setMealCalories('');
    setMealProtein('');
    setMealCarbs('');
    setMealFats('');
  };

  const handleCreatePlan = async () => {
    if (!planName.trim()) {
      toast.error('Please enter a plan name');
      return;
    }
    if (meals.length === 0) {
      toast.error('Please add at least one meal');
      return;
    }

    try {
      await createMealPlan.mutateAsync({
        name: planName,
        description: planDescription || undefined,
        meals,
      });
      toast.success('Meal plan created!');
      setShowCreateDialog(false);
      setPlanName('');
      setPlanDescription('');
      setMeals([]);
    } catch (error) {
      toast.error('Failed to create plan');
    }
  };

  const handleUsePlan = async (planMeals: MealPlanMeal[]) => {
    try {
      for (const meal of planMeals) {
        await addEntry.mutateAsync({
          food_name: meal.name,
          calories: meal.calories,
          protein_g: meal.protein,
          carbs_g: meal.carbs,
          fats_g: meal.fats,
          meal_type: meal.mealType,
        });
      }
      toast.success('All meals logged!');
    } catch (error) {
      toast.error('Failed to log meals');
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      await deleteMealPlan.mutateAsync(id);
      toast.success('Plan deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const getTotalNutrition = (planMeals: MealPlanMeal[]) => {
    return planMeals.reduce((acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fats: acc.fats + m.fats,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  };

  return (
    <div className="glass rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-accent" />
          Meal Plans
        </h3>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Meal Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Plan Name *</label>
                <Input
                  placeholder="e.g., High Protein Day"
                  value={planName}
                  onChange={e => setPlanName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Description</label>
                <Input
                  placeholder="Optional description"
                  value={planDescription}
                  onChange={e => setPlanDescription(e.target.value)}
                />
              </div>

              {/* Add meals */}
              <div className="border-t border-border pt-4">
                <p className="font-medium mb-3">Add Meals</p>
                <div className="space-y-3">
                  <Input
                    placeholder="Meal name"
                    value={mealName}
                    onChange={e => setMealName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    {MEAL_TYPES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setMealType(t.value)}
                        className={`flex-1 py-2 rounded-lg text-xs transition-all ${
                          mealType === t.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary'
                        }`}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Calories *</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={mealCalories}
                        onChange={e => setMealCalories(e.target.value ? Number(e.target.value) : '')}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Protein</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={mealProtein}
                        onChange={e => setMealProtein(e.target.value ? Number(e.target.value) : '')}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Carbs</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={mealCarbs}
                        onChange={e => setMealCarbs(e.target.value ? Number(e.target.value) : '')}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Fats</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={mealFats}
                        onChange={e => setMealFats(e.target.value ? Number(e.target.value) : '')}
                      />
                    </div>
                  </div>
                  <Button variant="secondary" className="w-full" onClick={addMealToPlan}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Meal
                  </Button>
                </div>
              </div>

              {/* Meals list */}
              {meals.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Meals in Plan ({meals.length})</p>
                  {meals.map((meal, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-secondary/50">
                      <div>
                        <p className="font-medium text-sm">{meal.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {meal.calories} cal | P:{meal.protein}g C:{meal.carbs}g F:{meal.fats}g
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMeals(meals.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="energy"
                className="w-full"
                onClick={handleCreatePlan}
                disabled={createMealPlan.isPending}
              >
                {createMealPlan.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Create Plan'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : mealPlans.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">No meal plans yet</p>
      ) : (
        <div className="space-y-3">
          {mealPlans.map(plan => {
            const totals = getTotalNutrition(plan.meals);
            const isExpanded = expandedPlan === plan.id;
            
            return (
              <div key={plan.id} className="rounded-lg bg-secondary/30 overflow-hidden">
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                >
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {plan.meals.length} meals • {totals.calories} cal
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={e => {
                        e.stopPropagation();
                        handleUsePlan(plan.meals);
                      }}
                    >
                      <Play className="w-4 h-4 text-accent" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={e => {
                        e.stopPropagation();
                        handleDeletePlan(plan.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2 border-t border-border/30">
                    {plan.meals.map((meal, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <span>{MEAL_TYPES.find(t => t.value === meal.mealType)?.icon}</span>
                          <span className="text-sm">{meal.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{meal.calories} cal</span>
                      </div>
                    ))}
                    <div className="flex justify-around pt-2 border-t border-border/30 text-xs">
                      <span>P: {totals.protein}g</span>
                      <span>C: {totals.carbs}g</span>
                      <span>F: {totals.fats}g</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
