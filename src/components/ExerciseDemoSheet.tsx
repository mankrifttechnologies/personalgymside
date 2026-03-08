import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2, ImageIcon, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExerciseStep {
  step: number;
  title: string;
  description: string;
  imageUrl: string | null;
}

interface ExerciseDemoSheetProps {
  exerciseName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExerciseDemoSheet({ exerciseName, open, onOpenChange }: ExerciseDemoSheetProps) {
  const [steps, setSteps] = useState<ExerciseStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasGenerated, setHasGenerated] = useState<string | null>(null);

  const generateDemo = async () => {
    if (!exerciseName) return;
    setIsLoading(true);
    setSteps([]);
    setCurrentStep(0);

    try {
      const { data, error } = await supabase.functions.invoke('generate-exercise-demo', {
        body: { exerciseName },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setSteps(data.steps || []);
      setHasGenerated(exerciseName);
    } catch (err) {
      toast.error('Failed to generate exercise demo');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate when opened with a new exercise
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && exerciseName && hasGenerated !== exerciseName) {
      generateDemo();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            {exerciseName || 'Exercise Demo'}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex flex-col h-[calc(100%-4rem)]">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating step-by-step demo...</p>
              <p className="text-xs text-muted-foreground">This may take a few seconds</p>
            </div>
          ) : steps.length > 0 ? (
            <>
              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                      i === currentStep
                        ? 'bg-primary text-primary-foreground scale-110'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {/* Current step */}
              <div className="flex-1 flex flex-col items-center overflow-y-auto">
                <h3 className="text-lg font-semibold mb-2">
                  Step {steps[currentStep].step}: {steps[currentStep].title}
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-4 px-4">
                  {steps[currentStep].description}
                </p>

                {steps[currentStep].imageUrl ? (
                  <div className="w-full max-w-sm rounded-xl overflow-hidden border bg-card">
                    <img
                      src={steps[currentStep].imageUrl}
                      alt={`Step ${steps[currentStep].step}: ${steps[currentStep].title}`}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-sm h-64 rounded-xl border bg-secondary/50 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Image unavailable</p>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setHasGenerated(null); generateDemo(); }}
                  disabled={isLoading}
                >
                  <RefreshCw className="w-4 h-4 mr-1" /> Regenerate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  disabled={currentStep === steps.length - 1}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No demo generated yet</p>
              <Button onClick={generateDemo} variant="energy">
                Generate Demo
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
