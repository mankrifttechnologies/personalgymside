import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useCalories } from '@/hooks/useCalories';
import { useAICoach } from '@/hooks/useAICoach';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MealType } from '@/types/fitness';
import { 
  Utensils, Plus, ChevronLeft, Sparkles, Trash2,
  Activity, Dumbbell, User, Loader2, X, Search
} from 'lucide-react';
import { toast } from 'sonner';

const MEAL_TYPES: { value: MealType; label: string; icon: string }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { value: 'lunch', label: 'Lunch', icon: '☀️' },
  { value: 'dinner', label: 'Dinner', icon: '🌙' },
  { value: 'snack', label: 'Snack', icon: '🍎' },
];

const COMMON_FOODS = [
  { name: 'Chicken Breast (100g)', calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  { name: 'Brown Rice (100g)', calories: 112, protein: 2.6, carbs: 24, fats: 0.9 },
  { name: 'Eggs (2)', calories: 143, protein: 12.6, carbs: 0.7, fats: 9.5 },
  { name: 'Greek Yogurt (150g)', calories: 100, protein: 17, carbs: 6, fats: 0.7 },
  { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fats: 0.4 },
  { name: 'Oats (50g)', calories: 194, protein: 6.5, carbs: 33.5, fats: 3.4 },
  { name: 'Paneer (100g)', calories: 265, protein: 18.3, carbs: 1.2, fats: 20.8 },
  { name: 'Dal (1 cup)', calories: 198, protein: 14, carbs: 35, fats: 0.7 },
  { name: 'Whey Protein Shake', calories: 120, protein: 24, carbs: 3, fats: 1 },
  { name: 'Almonds (28g)', calories: 164, protein: 6, carbs: 6, fats: 14 },
  { name: 'Sweet Potato (100g)', calories: 86, protein: 1.6, carbs: 20, fats: 0.1 },
  { name: 'Salmon (100g)', calories: 208, protein: 20, carbs: 0, fats: 13 },
];

export default function Nutrition() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const { entries, addEntry, deleteEntry, totals, isLoading } = useCalories();
  const { isLoading: aiLoading, response: aiResponse, error: aiError, getDietRecommendation } = useAICoach();
  
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  
  // Custom food form
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState<number | ''>('');
  const [protein, setProtein] = useState<number | ''>('');
  const [carbs, setCarbs] = useState<number | ''>('');
  const [fats, setFats] = useState<number | ''>('');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-glow p-4 rounded-full bg-primary/20">
          <Utensils className="w-8 h-8 text-primary animate-float" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const calorieTarget = profile?.daily_calorie_target || 2000;
  const calorieProgress = Math.min((totals.calories / calorieTarget) * 100, 100);
  const remaining = calorieTarget - totals.calories;

  const filteredFoods = COMMON_FOODS.filter(food => 
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuickAdd = async (food: typeof COMMON_FOODS[0]) => {
    try {
      await addEntry.mutateAsync({
        food_name: food.name,
        calories: food.calories,
        protein_g: food.protein,
        carbs_g: food.carbs,
        fats_g: food.fats,
        meal_type: selectedMeal,
      });
      toast.success(`Added ${food.name}!`);
    } catch (error) {
      toast.error('Failed to add food');
      console.error(error);
    }
  };

  const handleCustomAdd = async () => {
    if (!foodName || !calories) {
      toast.error('Please enter food name and calories');
      return;
    }

    try {
      await addEntry.mutateAsync({
        food_name: foodName,
        calories: calories as number,
        protein_g: (protein as number) || 0,
        carbs_g: (carbs as number) || 0,
        fats_g: (fats as number) || 0,
        meal_type: selectedMeal,
      });
      toast.success(`Added ${foodName}!`);
      
      // Reset form
      setFoodName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFats('');
      setShowCustomForm(false);
    } catch (error) {
      toast.error('Failed to add food');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry.mutateAsync(id);
      toast.success('Entry deleted');
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

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
          <h1 className="text-xl font-bold">Nutrition</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <Button 
          variant="glass" 
          size="sm" 
          onClick={() => setShowAIPanel(!showAIPanel)}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          AI Diet
        </Button>
      </header>

      <main className="px-4 space-y-6">
        {/* Calorie Summary */}
        <div className="glass rounded-xl p-4 animate-slide-up">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Daily Goal</p>
              <p className="text-3xl font-bold">{totals.calories} <span className="text-lg text-muted-foreground">/ {calorieTarget}</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className={`text-2xl font-bold ${remaining < 0 ? 'text-destructive' : 'text-accent'}`}>
                {remaining}
              </p>
            </div>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                calorieProgress > 100 ? 'bg-destructive' : 'bg-gradient-to-r from-primary to-accent'
              }`}
              style={{ width: `${Math.min(calorieProgress, 100)}%` }}
            />
          </div>
          
          {/* Macro breakdown */}
          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            <div className="p-2 rounded-lg bg-secondary/50">
              <p className="text-xl font-bold text-primary">{Math.round(totals.protein)}g</p>
              <p className="text-xs text-muted-foreground">Protein</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary/50">
              <p className="text-xl font-bold text-accent">{Math.round(totals.carbs)}g</p>
              <p className="text-xs text-muted-foreground">Carbs</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary/50">
              <p className="text-xl font-bold text-warning">{Math.round(totals.fats)}g</p>
              <p className="text-xs text-muted-foreground">Fats</p>
            </div>
          </div>
        </div>

        {/* AI Panel */}
        {showAIPanel && (
          <div className="glass rounded-xl p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Diet Recommendation
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAIPanel(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {!aiResponse && !aiLoading && (
              <Button 
                variant="energy" 
                className="w-full" 
                onClick={getDietRecommendation}
              >
                Get Meal Suggestions
              </Button>
            )}
            
            {aiLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating recommendations...
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

        {/* Meal Type Selection */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {MEAL_TYPES.map((meal) => (
            <button
              key={meal.value}
              onClick={() => setSelectedMeal(meal.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedMeal === meal.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              <span>{meal.icon}</span>
              <span className="text-sm font-medium">{meal.label}</span>
            </button>
          ))}
        </div>

        {/* Food Search */}
        <div className="glass rounded-xl p-4 animate-slide-up">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search foods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredFoods.map((food, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAdd(food)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-sm">{food.name}</p>
                  <p className="text-xs text-muted-foreground">
                    P: {food.protein}g | C: {food.carbs}g | F: {food.fats}g
                  </p>
                </div>
                <span className="text-primary font-bold">{food.calories}</span>
              </button>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => setShowCustomForm(!showCustomForm)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Food
          </Button>
        </div>

        {/* Custom Food Form */}
        {showCustomForm && (
          <div className="glass rounded-xl p-4 animate-slide-up">
            <h3 className="font-semibold mb-3">Add Custom Food</h3>
            <div className="space-y-3">
              <Input
                placeholder="Food name"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Calories *</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value ? Number(e.target.value) : '')}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Protein (g)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value ? Number(e.target.value) : '')}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Carbs (g)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value ? Number(e.target.value) : '')}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Fats (g)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={fats}
                    onChange={(e) => setFats(e.target.value ? Number(e.target.value) : '')}
                  />
                </div>
              </div>
              <Button 
                variant="energy" 
                className="w-full"
                onClick={handleCustomAdd}
                disabled={addEntry.isPending}
              >
                {addEntry.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Food'}
              </Button>
            </div>
          </div>
        )}

        {/* Today's Entries */}
        {entries && entries.length > 0 && (
          <div className="glass rounded-xl p-4 animate-slide-up">
            <h3 className="font-semibold mb-3">Today's Log</h3>
            <div className="space-y-2">
              {entries.map((entry) => (
                <div 
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{MEAL_TYPES.find(m => m.value === entry.meal_type)?.icon || '🍽️'}</span>
                      <p className="font-medium text-sm">{entry.food_name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      P: {entry.protein_g}g | C: {entry.carbs_g}g | F: {entry.fats_g}g
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold">{entry.calories}</span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
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
          <Link to="/workout" className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors">
            <Dumbbell className="w-6 h-6" />
            <span className="text-xs mt-1">Workout</span>
          </Link>
          <Link to="/workout" className="relative -top-4">
            <Button variant="energy" size="icon" className="w-14 h-14 rounded-full shadow-lg">
              <Plus className="w-7 h-7" />
            </Button>
          </Link>
          <Link to="/nutrition" className="flex flex-col items-center text-primary">
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
