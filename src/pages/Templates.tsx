import { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useWorkoutTemplates, TEMPLATE_CATEGORIES, TemplateWithExercises } from '@/hooks/useWorkoutTemplates';
import { useWorkouts } from '@/hooks/useWorkouts';
import { Button } from '@/components/ui/button';
import { MUSCLE_GROUPS } from '@/types/fitness';
import { 
  Layers, ChevronLeft, Play, Check,
  Activity, Dumbbell, Utensils, User, Plus, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function Templates() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { templates, isLoading } = useWorkoutTemplates();
  const { todayWorkout, createWorkout, addExercise } = useWorkouts();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateWithExercises | null>(null);
  const [startingWorkout, setStartingWorkout] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-glow p-4 rounded-full bg-primary/20">
          <Layers className="w-8 h-8 text-primary animate-float" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleStartWorkout = async (template: TemplateWithExercises) => {
    setStartingWorkout(true);
    try {
      let workoutId = todayWorkout?.id;
      
      if (!workoutId) {
        const today = new Date().toISOString().split('T')[0];
        const workout = await createWorkout.mutateAsync({ date: today, notes: template.name });
        workoutId = workout.id;
      }

      // Add all exercises from template
      for (const exercise of template.exercises) {
        await addExercise.mutateAsync({
          workout_id: workoutId,
          muscle_group: exercise.muscle_group,
          exercise_name: exercise.exercise_name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight_kg: null,
        });
      }

      toast.success(`Started ${template.name}!`);
      navigate('/workout');
    } catch (error) {
      toast.error('Failed to start workout');
      console.error(error);
    } finally {
      setStartingWorkout(false);
    }
  };

  const systemTemplates = templates?.filter(t => t.is_system) || [];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="p-4 flex items-center gap-3">
        <Link to="/workout">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Workout Templates</h1>
          <p className="text-sm text-muted-foreground">Pre-built routines</p>
        </div>
      </header>

      <main className="px-4 space-y-6">
        {/* Template Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedTemplate(null)}
              className="flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap bg-secondary hover:bg-secondary/80 transition-all"
            >
              <span>{cat.icon}</span>
              <span className="text-sm font-medium">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Template Detail View */}
        {selectedTemplate && (
          <div className="glass rounded-xl p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">{selectedTemplate.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
              </div>
              <Button 
                variant="energy" 
                onClick={() => handleStartWorkout(selectedTemplate)}
                disabled={startingWorkout}
              >
                {startingWorkout ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Start
                  </>
                )}
              </Button>
            </div>
            
            <div className="space-y-2">
              {selectedTemplate.exercises.map((exercise, idx) => {
                const muscleInfo = MUSCLE_GROUPS.find(m => m.value === exercise.muscle_group);
                return (
                  <div 
                    key={exercise.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                  >
                    <span className="text-sm text-muted-foreground w-6">{idx + 1}</span>
                    <div className={`w-2 h-8 rounded-full ${muscleInfo?.color || 'bg-primary'}`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{exercise.exercise_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{exercise.muscle_group}</p>
                    </div>
                    <span className="text-sm text-primary">
                      {exercise.sets} × {exercise.reps}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <Button 
              variant="ghost" 
              className="w-full mt-4"
              onClick={() => setSelectedTemplate(null)}
            >
              Back to Templates
            </Button>
          </div>
        )}

        {/* Template List */}
        {!selectedTemplate && (
          <div className="space-y-4">
            {TEMPLATE_CATEGORIES.map((category) => {
              const categoryTemplates = systemTemplates.filter(t => t.category === category.value);
              if (categoryTemplates.length === 0) return null;

              return (
                <div key={category.value} className="animate-slide-up">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span>{category.icon}</span>
                    {category.label}
                  </h3>
                  <div className="space-y-2">
                    {categoryTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className="w-full glass rounded-xl p-4 text-left hover:scale-[1.02] transition-transform"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{template.name}</p>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                            <div className="flex gap-1 mt-2">
                              {template.exercises.slice(0, 4).map((ex, idx) => {
                                const muscleInfo = MUSCLE_GROUPS.find(m => m.value === ex.muscle_group);
                                return (
                                  <div 
                                    key={idx}
                                    className={`w-2 h-2 rounded-full ${muscleInfo?.color || 'bg-primary'}`}
                                  />
                                );
                              })}
                              {template.exercises.length > 4 && (
                                <span className="text-xs text-muted-foreground">+{template.exercises.length - 4}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">{template.exercises.length}</p>
                            <p className="text-xs text-muted-foreground">exercises</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
