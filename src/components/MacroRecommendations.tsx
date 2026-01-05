import { useProfile } from '@/hooks/useProfile';
import { useCalories } from '@/hooks/useCalories';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, AlertCircle } from 'lucide-react';

const MACRO_RECOMMENDATIONS = {
  muscle_gain: { protein: 0.30, carbs: 0.45, fats: 0.25, description: 'High protein for muscle synthesis, moderate carbs for energy' },
  fat_loss: { protein: 0.35, carbs: 0.35, fats: 0.30, description: 'Higher protein to preserve muscle, moderate fats for satiety' },
  strength: { protein: 0.30, carbs: 0.50, fats: 0.20, description: 'Carb-focused for power output, protein for recovery' },
  maintenance: { protein: 0.25, carbs: 0.45, fats: 0.30, description: 'Balanced macros for general health' },
};

export default function MacroRecommendations() {
  const { profile } = useProfile();
  const { totals } = useCalories();
  
  const goal = profile?.fitness_goal as keyof typeof MACRO_RECOMMENDATIONS || 'maintenance';
  const dailyCalories = profile?.daily_calorie_target || 2000;
  
  const recommendation = MACRO_RECOMMENDATIONS[goal] || MACRO_RECOMMENDATIONS.maintenance;
  
  const targetMacros = {
    protein: Math.round((dailyCalories * recommendation.protein) / 4), // 4 cal/g
    carbs: Math.round((dailyCalories * recommendation.carbs) / 4), // 4 cal/g
    fats: Math.round((dailyCalories * recommendation.fats) / 9), // 9 cal/g
  };

  const getMacroStatus = (current: number, target: number) => {
    const ratio = current / target;
    if (ratio < 0.8) return 'low';
    if (ratio > 1.1) return 'high';
    return 'good';
  };

  const macros = [
    { name: 'Protein', current: Math.round(totals.protein), target: targetMacros.protein, unit: 'g', color: 'text-primary' },
    { name: 'Carbs', current: Math.round(totals.carbs), target: targetMacros.carbs, unit: 'g', color: 'text-accent' },
    { name: 'Fats', current: Math.round(totals.fats), target: targetMacros.fats, unit: 'g', color: 'text-warning' },
  ];

  return (
    <div className="glass rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">AI Macro Recommendations</h3>
      </div>
      
      <div className="p-3 rounded-lg bg-secondary/50">
        <p className="text-sm font-medium capitalize">{goal.replace('_', ' ')} Goal</p>
        <p className="text-xs text-muted-foreground mt-1">{recommendation.description}</p>
      </div>

      <div className="space-y-3">
        {macros.map(macro => {
          const status = getMacroStatus(macro.current, macro.target);
          const progress = Math.min((macro.current / macro.target) * 100, 150);
          
          return (
            <div key={macro.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{macro.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${macro.color}`}>
                    {macro.current}{macro.unit}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {macro.target}{macro.unit}
                  </span>
                  {status === 'low' && (
                    <TrendingUp className="w-4 h-4 text-warning" />
                  )}
                  {status === 'high' && (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  )}
                </div>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    status === 'good' ? 'bg-accent' : 
                    status === 'low' ? 'bg-warning' : 'bg-destructive'
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-2 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          Recommended split: {Math.round(recommendation.protein * 100)}% P / {Math.round(recommendation.carbs * 100)}% C / {Math.round(recommendation.fats * 100)}% F
        </p>
      </div>
    </div>
  );
}
