import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWeeklySchedule, DAYS_OF_WEEK } from '@/hooks/useWeeklySchedule';
import { useWorkoutTemplates, TemplateWithExercises } from '@/hooks/useWorkoutTemplates';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { 
  Calendar, ChevronLeft, Check, X, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function Schedule() {
  const { user, loading: authLoading } = useAuth();
  const { schedule, isLoading, setDayTemplate, getTodaySchedule } = useWeeklySchedule();
  const { templates } = useWorkoutTemplates();
  const [editingDay, setEditingDay] = useState<number | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-glow p-4 rounded-full bg-primary/20">
          <Calendar className="w-8 h-8 text-primary animate-float" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const todaySchedule = getTodaySchedule();
  const systemTemplates = templates?.filter(t => t.is_system) || [];

  const handleAssignTemplate = async (dayOfWeek: number, templateId: string | null) => {
    try {
      await setDayTemplate.mutateAsync({ dayOfWeek, templateId });
      toast.success(templateId ? 'Template assigned!' : 'Rest day set!');
      setEditingDay(null);
    } catch (error) {
      toast.error('Failed to update schedule');
    }
  };

  const getScheduleForDay = (dayOfWeek: number) => {
    return schedule?.find(s => s.day_of_week === dayOfWeek);
  };

  return (
    <div className="min-h-screen pb-24 safe-area-top">
      {/* Header */}
      <header className="p-4 flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Weekly Schedule</h1>
          <p className="text-sm text-muted-foreground">Plan your workout week</p>
        </div>
      </header>

      <main className="px-4 space-y-6">
        {/* Today's Workout */}
        {todaySchedule?.template && (
          <div className="glass rounded-xl p-4 animate-slide-up border-l-4 border-primary">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Today's Workout</span>
            </div>
            <h3 className="text-xl font-bold">{todaySchedule.template.name}</h3>
            <p className="text-sm text-muted-foreground">{todaySchedule.template.description}</p>
            <Link to="/templates">
              <Button variant="energy" className="mt-3 w-full">
                Start Workout
              </Button>
            </Link>
          </div>
        )}

        {/* Weekly Schedule */}
        <div className="glass rounded-xl p-4 animate-slide-up">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Weekly Plan
          </h3>
          
          <div className="space-y-2">
            {DAYS_OF_WEEK.map((day) => {
              const daySchedule = getScheduleForDay(day.value);
              const isToday = new Date().getDay() === day.value;
              const isEditing = editingDay === day.value;

              return (
                <div key={day.value}>
                  <button
                    onClick={() => setEditingDay(isEditing ? null : day.value)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      isToday 
                        ? 'bg-primary/20 border border-primary/50' 
                        : 'bg-secondary/50 hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                        isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        {day.short}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">{day.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {daySchedule?.template?.name || 'Rest Day'}
                        </p>
                      </div>
                    </div>
                    {daySchedule?.template && (
                      <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent capitalize">
                        {daySchedule.template.category}
                      </span>
                    )}
                  </button>

                  {/* Template Selection */}
                  {isEditing && (
                    <div className="mt-2 p-3 rounded-xl bg-secondary/30 animate-slide-up space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Select Template</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingDay(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <button
                        onClick={() => handleAssignTemplate(day.value, null)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <span className="text-lg">😴</span>
                        <span className="text-sm">Rest Day</span>
                        {!daySchedule?.template && <Check className="w-4 h-4 text-accent ml-auto" />}
                      </button>
                      
                      {systemTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleAssignTemplate(day.value, template.id)}
                          disabled={setDayTemplate.isPending}
                          className="w-full flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <span className="text-lg">💪</span>
                          <div className="text-left flex-1">
                            <p className="text-sm font-medium">{template.name}</p>
                            <p className="text-xs text-muted-foreground">{template.exercises.length} exercises</p>
                          </div>
                          {daySchedule?.template?.id === template.id && (
                            <Check className="w-4 h-4 text-accent" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
