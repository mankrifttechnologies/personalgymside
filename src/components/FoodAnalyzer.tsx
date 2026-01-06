import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCalories } from '@/hooks/useCalories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, Sparkles, Loader2, Plus, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { MealType } from '@/types/fitness';

interface NutritionResult {
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
}

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: '🌅 Breakfast' },
  { value: 'lunch', label: '☀️ Lunch' },
  { value: 'dinner', label: '🌙 Dinner' },
  { value: 'snack', label: '🍎 Snack' },
];

export const FoodAnalyzer = () => {
  const { addEntry } = useCalories();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<NutritionResult | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealType>('lunch');

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeFood = async () => {
    if (!description && !imageBase64) {
      toast.error('Please add a description or upload an image');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-food', {
        body: { description, imageBase64 },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data);
      toast.success('Food analyzed!');
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Failed to analyze food');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addToLog = async () => {
    if (!result) return;

    try {
      await addEntry.mutateAsync({
        food_name: result.food_name,
        calories: result.calories,
        protein_g: result.protein_g,
        carbs_g: result.carbs_g,
        fats_g: result.fats_g,
        meal_type: selectedMeal,
      });
      
      toast.success(`Added ${result.food_name} to your log!`);
      
      // Reset
      setResult(null);
      setDescription('');
      clearImage();
    } catch (error) {
      toast.error('Failed to add to log');
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-orange-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Food Analyzer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Image Upload */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Food preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2"
                onClick={clearImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Describe your food (optional with image)
          </label>
          <Textarea
            placeholder="e.g., Grilled chicken with rice and vegetables, medium portion..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        {/* Analyze Button */}
        <Button
          variant="energy"
          className="w-full"
          onClick={analyzeFood}
          disabled={isAnalyzing || (!description && !imageBase64)}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze Food
            </>
          )}
        </Button>

        {/* Result */}
        {result && (
          <div className="p-4 rounded-lg bg-secondary/50 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{result.food_name}</h4>
              <span className={`text-xs ${getConfidenceColor(result.confidence)}`}>
                {result.confidence} confidence
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded bg-background">
                <p className="text-lg font-bold text-primary">{result.calories}</p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
              <div className="p-2 rounded bg-background">
                <p className="text-lg font-bold text-blue-500">{result.protein_g}g</p>
                <p className="text-xs text-muted-foreground">Protein</p>
              </div>
              <div className="p-2 rounded bg-background">
                <p className="text-lg font-bold text-green-500">{result.carbs_g}g</p>
                <p className="text-xs text-muted-foreground">Carbs</p>
              </div>
              <div className="p-2 rounded bg-background">
                <p className="text-lg font-bold text-yellow-500">{result.fats_g}g</p>
                <p className="text-xs text-muted-foreground">Fats</p>
              </div>
            </div>

            {result.notes && (
              <p className="text-sm text-muted-foreground">{result.notes}</p>
            )}

            <div className="flex gap-2">
              <Select value={selectedMeal} onValueChange={(v) => setSelectedMeal(v as MealType)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map((meal) => (
                    <SelectItem key={meal.value} value={meal.value}>
                      {meal.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="energy"
                className="flex-1"
                onClick={addToLog}
                disabled={addEntry.isPending}
              >
                {addEntry.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Add to Log
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
