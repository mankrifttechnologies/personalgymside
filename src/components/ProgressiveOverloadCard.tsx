import { useProgressiveOverload, OverloadSuggestion } from '@/hooks/useProgressiveOverload';
import { TrendingUp, ArrowUp, Minus, ArrowDown, Loader2 } from 'lucide-react';

const trendConfig = {
  increase_weight: { icon: ArrowUp, color: 'text-accent', bg: 'bg-accent/20', label: '↑ Weight' },
  increase_reps: { icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/20', label: '↑ Reps' },
  maintain: { icon: Minus, color: 'text-muted-foreground', bg: 'bg-muted/20', label: 'Maintain' },
  deload: { icon: ArrowDown, color: 'text-warning', bg: 'bg-warning/20', label: 'Deload' },
};

export default function ProgressiveOverloadCard() {
  const { data: suggestions, isLoading } = useProgressiveOverload();

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-4 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!suggestions?.length) return null;

  const actionable = suggestions.filter(s => s.trend === 'increase_weight' || s.trend === 'increase_reps');

  return (
    <div className="glass rounded-xl p-4 animate-slide-up">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-accent" />
        Progressive Overload
      </h3>

      {actionable.length > 0 && (
        <p className="text-xs text-accent mb-3">
          🔥 {actionable.length} exercise(s) ready to progress!
        </p>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {suggestions.slice(0, 6).map((s) => {
          const config = trendConfig[s.trend];
          const Icon = config.icon;
          return (
            <div key={s.exercise_name} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50">
              <div className={`p-1.5 rounded-lg ${config.bg}`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{s.exercise_name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.current_weight > 0 ? `${s.current_weight}kg × ${s.current_reps}` : `${s.current_sets}×${s.current_reps}`}
                  {s.trend === 'increase_weight' && (
                    <span className="text-accent ml-1">→ {s.suggested_weight}kg</span>
                  )}
                  {s.trend === 'increase_reps' && (
                    <span className="text-primary ml-1">→ {s.suggested_reps} reps</span>
                  )}
                </p>
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
