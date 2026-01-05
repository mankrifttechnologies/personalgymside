import { useState } from 'react';
import { useWaterIntake } from '@/hooks/useWaterIntake';
import { Button } from '@/components/ui/button';
import { Droplets, Plus, Minus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WaterTracker() {
  const { totalMl, dailyGoal, progress, glasses, addWater, isLoading } = useWaterIntake();
  const [adding, setAdding] = useState(false);

  const quickAmounts = [150, 250, 500, 750];

  const handleAddWater = async (amount: number) => {
    setAdding(true);
    try {
      await addWater.mutateAsync(amount);
      toast.success(`+${amount}ml added!`);
    } catch (error) {
      toast.error('Failed to add water');
    }
    setAdding(false);
  };

  const getWaveHeight = () => {
    return Math.min(progress, 100);
  };

  return (
    <div className="glass rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-400" />
          Water Intake
        </h3>
        <span className="text-sm text-muted-foreground">
          {glasses} glasses today
        </span>
      </div>

      {/* Visual water bottle */}
      <div className="flex items-center justify-center">
        <div className="relative w-24 h-40 rounded-b-3xl rounded-t-lg border-4 border-blue-400/30 overflow-hidden bg-secondary/30">
          {/* Water level */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-500"
            style={{ height: `${getWaveHeight()}%` }}
          >
            {/* Wave effect */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-blue-300/30 animate-pulse" 
                 style={{ borderRadius: '50% 50% 0 0' }} />
          </div>
          
          {/* Measurement lines */}
          {[25, 50, 75].map(line => (
            <div 
              key={line} 
              className="absolute left-0 right-0 border-t border-blue-400/20"
              style={{ bottom: `${line}%` }}
            />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="text-center">
        <p className="text-3xl font-bold text-blue-400">
          {totalMl}<span className="text-lg text-muted-foreground">/{dailyGoal}ml</span>
        </p>
        <p className="text-sm text-muted-foreground">{Math.round(progress)}% of daily goal</p>
      </div>

      {/* Quick add buttons */}
      <div className="grid grid-cols-4 gap-2">
        {quickAmounts.map(amount => (
          <Button
            key={amount}
            variant="secondary"
            size="sm"
            onClick={() => handleAddWater(amount)}
            disabled={adding}
            className="flex flex-col h-auto py-2"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-3 h-3" />
                <span className="text-xs">{amount}ml</span>
              </>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
