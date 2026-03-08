import { useState } from 'react';
import { useMobilityRoutines, useRoutineTimer, MobilityExercise } from '@/hooks/useMobilityRoutines';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BottomNav from '@/components/BottomNav';
import { ArrowLeft, Play, Pause, SkipForward, RotateCcw, Timer, Flame, Snowflake, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const TYPE_ICONS: Record<string, any> = {
  warmup: Flame,
  cooldown: Snowflake,
  mobility: Activity,
};
const TYPE_COLORS: Record<string, string> = {
  warmup: 'bg-primary/20 text-primary',
  cooldown: 'bg-accent/20 text-accent',
  mobility: 'bg-purple-500/20 text-purple-400',
};

function RoutinePlayer({ exercises, onClose }: { exercises: MobilityExercise[]; onClose: () => void }) {
  const { currentExercise, currentIndex, timeLeft, isRunning, isComplete, progress, totalExercises, start, pause, resume, skip } = useRoutineTimer(exercises);
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    start();
    setStarted(true);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (isComplete) {
    return (
      <DialogContent className="max-w-sm">
        <div className="text-center py-8 space-y-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold">Routine Complete!</h2>
          <p className="text-muted-foreground">Great job warming up. You're ready to crush it!</p>
          <Button variant="energy" className="w-full" onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    );
  }

  if (!started) {
    return (
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ready to Start?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">{exercises.length} exercises • ~{Math.round(exercises.reduce((s, e) => s + e.duration_seconds, 0) / 60)} min</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {exercises.map((ex, i) => (
              <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-secondary/50">
                <span className="text-sm">{ex.name}</span>
                <span className="text-xs text-muted-foreground">{ex.duration_seconds}s</span>
              </div>
            ))}
          </div>
          <Button variant="energy" className="w-full" onClick={handleStart}>
            <Play className="w-4 h-4 mr-2" /> Start Routine
          </Button>
        </div>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="max-w-sm">
      <div className="space-y-6 py-4">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground text-center">
          Exercise {currentIndex + 1} of {totalExercises}
        </p>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">{currentExercise?.name}</h2>
          <p className="text-muted-foreground">{currentExercise?.description}</p>
        </div>

        <div className="text-center">
          <div className="text-6xl font-bold tabular-nums text-primary">
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Button variant="outline" size="icon" onClick={isRunning ? pause : resume}>
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button variant="outline" size="icon" onClick={skip}>
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

export default function Mobility() {
  const { routines, isLoading } = useMobilityRoutines();
  const [activeRoutine, setActiveRoutine] = useState<any>(null);
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? routines : routines.filter(r => r.routine_type === filter);

  return (
    <div className="min-h-screen pb-24">
      <header className="p-4 flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Stretching & Mobility</h1>
          <p className="text-sm text-muted-foreground">Guided routines with timers</p>
        </div>
      </header>

      <main className="px-4 space-y-4">
        {/* Filter */}
        <div className="flex gap-2">
          {['all', 'warmup', 'cooldown', 'mobility'].map(type => (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(type)}
              className="capitalize"
            >
              {type === 'all' ? 'All' : type}
            </Button>
          ))}
        </div>

        {/* Routines */}
        {filtered.map((routine: any) => {
          const Icon = TYPE_ICONS[routine.routine_type] || Activity;
          return (
            <Card key={routine.id} className="glass border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{routine.title}</h3>
                      <Badge className={TYPE_COLORS[routine.routine_type] || ''}>
                        <Icon className="w-3 h-3 mr-1" />
                        {routine.routine_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{routine.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Timer className="w-4 h-4" /> {routine.duration_minutes} min
                    </span>
                    <span>{routine.exercises?.length || 0} exercises</span>
                  </div>
                  <Button variant="energy" size="sm" onClick={() => setActiveRoutine(routine)}>
                    <Play className="w-4 h-4 mr-1" /> Start
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </main>

      {/* Routine Player */}
      {activeRoutine && (
        <Dialog open onOpenChange={() => setActiveRoutine(null)}>
          <RoutinePlayer
            exercises={activeRoutine.exercises || []}
            onClose={() => setActiveRoutine(null)}
          />
        </Dialog>
      )}

      <BottomNav />
    </div>
  );
}
