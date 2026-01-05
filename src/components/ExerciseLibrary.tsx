import { useState } from 'react';
import { useExerciseLibrary, Exercise } from '@/hooks/useExerciseLibrary';
import { MUSCLE_GROUPS, MuscleGroup } from '@/types/fitness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Info, Dumbbell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExerciseLibraryProps {
  onSelectExercise?: (exercise: Exercise) => void;
}

export default function ExerciseLibrary({ onSelectExercise }: ExerciseLibraryProps) {
  const { exercises, isLoading, addCustomExercise } = useExerciseLibrary();
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  // New exercise form
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState<MuscleGroup>('chest');
  const [newDescription, setNewDescription] = useState('');
  const [newInstructions, setNewInstructions] = useState('');

  const filteredExercises = exercises.filter(ex => {
    const matchesMuscle = selectedMuscle === 'all' || ex.muscle_group === selectedMuscle;
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMuscle && matchesSearch;
  });

  const handleAddExercise = async () => {
    if (!newName.trim()) {
      toast.error('Please enter an exercise name');
      return;
    }

    try {
      await addCustomExercise.mutateAsync({
        name: newName,
        muscle_group: newMuscle,
        description: newDescription || undefined,
        instructions: newInstructions || undefined,
      });
      toast.success('Exercise added!');
      setShowAddDialog(false);
      setNewName('');
      setNewDescription('');
      setNewInstructions('');
    } catch (error) {
      toast.error('Failed to add exercise');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            <Button
              variant={selectedMuscle === 'all' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setSelectedMuscle('all')}
            >
              All
            </Button>
            {MUSCLE_GROUPS.map(muscle => (
              <Button
                key={muscle.value}
                variant={selectedMuscle === muscle.value ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedMuscle(muscle.value)}
                className="whitespace-nowrap"
              >
                {muscle.label}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Exercise List */}
      <ScrollArea className="h-64">
        <div className="space-y-2 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredExercises.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No exercises found</p>
          ) : (
            filteredExercises.map(exercise => {
              const muscleInfo = MUSCLE_GROUPS.find(m => m.value === exercise.muscle_group);
              return (
                <div
                  key={exercise.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                  onClick={() => onSelectExercise?.(exercise)}
                >
                  <div className={`w-2 h-10 rounded-full ${muscleInfo?.color || 'bg-primary'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{exercise.name}</p>
                    <p className="text-xs text-muted-foreground">{muscleInfo?.label}</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedExercise(exercise);
                        }}
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Dumbbell className="w-5 h-5 text-primary" />
                          {exercise.name}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Muscle Group</p>
                          <p>{muscleInfo?.label}</p>
                        </div>
                        {exercise.description && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Description</p>
                            <p>{exercise.description}</p>
                          </div>
                        )}
                        {exercise.instructions && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Instructions</p>
                            <p className="text-sm">{exercise.instructions}</p>
                          </div>
                        )}
                        {onSelectExercise && (
                          <Button
                            variant="energy"
                            className="w-full"
                            onClick={() => {
                              onSelectExercise(exercise);
                            }}
                          >
                            Select Exercise
                          </Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Add Custom Exercise */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Exercise
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Exercise Name *</label>
              <Input
                placeholder="e.g., Cable Fly"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Muscle Group *</label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {MUSCLE_GROUPS.map(muscle => (
                  <button
                    key={muscle.value}
                    onClick={() => setNewMuscle(muscle.value)}
                    className={`p-2 rounded-lg text-xs transition-all ${
                      newMuscle === muscle.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {muscle.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Description</label>
              <Input
                placeholder="Brief description"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Instructions</label>
              <Textarea
                placeholder="Step-by-step instructions..."
                value={newInstructions}
                onChange={e => setNewInstructions(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              variant="energy"
              className="w-full"
              onClick={handleAddExercise}
              disabled={addCustomExercise.isPending}
            >
              {addCustomExercise.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Add Exercise'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
