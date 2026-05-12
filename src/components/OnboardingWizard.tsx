import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { FitnessGoal, ActivityLevel, DietPreference } from '@/types/fitness';
import { Dumbbell, Target, Activity, Utensils, User, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const STEPS = ['Welcome', 'Profile', 'Goals', 'Activity', 'Diet'];

const GOALS: { value: FitnessGoal; label: string; icon: string; desc: string }[] = [
  { value: 'muscle_gain', label: 'Build Muscle', icon: '💪', desc: 'Pack on lean mass' },
  { value: 'fat_loss', label: 'Lose Fat', icon: '🔥', desc: 'Shed body fat' },
  { value: 'strength', label: 'Get Stronger', icon: '🏋️', desc: 'Increase max lifts' },
  { value: 'maintenance', label: 'Stay Fit', icon: '⚡', desc: 'Maintain current level' },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
  { value: 'light', label: 'Light', desc: '1-2 days/week' },
  { value: 'moderate', label: 'Moderate', desc: '3-4 days/week' },
  { value: 'active', label: 'Active', desc: '5-6 days/week' },
  { value: 'very_active', label: 'Very Active', desc: 'Daily intense training' },
];

const DIETS: { value: DietPreference; label: string; icon: string }[] = [
  { value: 'non_veg', label: 'Non-Vegetarian', icon: '🍗' },
  { value: 'veg', label: 'Vegetarian', icon: '🥦' },
  { value: 'vegan', label: 'Vegan', icon: '🌱' },
];

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { updateProfile } = useProfile();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [gender, setGender] = useState<string>('');
  const [goal, setGoal] = useState<FitnessGoal | ''>('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>('');
  const [diet, setDiet] = useState<DietPreference | ''>('');
  const [saving, setSaving] = useState(false);

  const progress = ((step + 1) / STEPS.length) * 100;

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return goal !== '';
    if (step === 3) return activityLevel !== '';
    if (step === 4) return diet !== '';
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        name: name.trim(),
        age: age ? parseInt(age) : null,
        height_cm: heightCm ? parseFloat(heightCm) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        gender: gender || null,
        fitness_goal: goal || null,
        activity_level: activityLevel || null,
        diet_preference: diet || null,
        onboarding_completed: true,
      } as any);
      toast.success('Welcome aboard! Let\'s crush it! 💪');
      onComplete();
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Progress */}
      <div className="p-4 pt-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span>{STEPS[step]}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {step === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-6 animate-fade-in">
            <div className="p-5 rounded-2xl bg-primary/20 animate-pulse-glow">
              <Dumbbell className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome to <span className="text-gradient">FitAI Coach</span></h1>
              <p className="text-muted-foreground">Let's set up your profile so we can personalize your experience.</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">About You</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Your Name *</label>
                <Input placeholder="e.g., Ankit" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground">Age</label>
                  <Input type="number" placeholder="25" value={age} onChange={e => setAge(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Gender</label>
                  <div className="flex gap-2 mt-1">
                    {['male', 'female', 'other'].map(g => (
                      <button key={g} onClick={() => setGender(g)}
                        className={`flex-1 py-2 rounded-lg text-xs capitalize transition-all ${gender === g ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                      >{g}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground">Height (cm)</label>
                  <Input type="number" placeholder="175" value={heightCm} onChange={e => setHeightCm(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Weight (kg)</label>
                  <Input type="number" placeholder="70" value={weightKg} onChange={e => setWeightKg(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Your Goal</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map(g => (
                <button key={g.value} onClick={() => setGoal(g.value)}
                  className={`p-4 rounded-xl text-left transition-all border-2 ${goal === g.value ? 'border-primary bg-primary/10' : 'border-transparent bg-secondary/50'}`}
                >
                  <span className="text-2xl mb-2 block">{g.icon}</span>
                  <p className="font-semibold text-sm">{g.label}</p>
                  <p className="text-xs text-muted-foreground">{g.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Activity Level</h2>
            </div>
            <div className="space-y-3">
              {ACTIVITY_LEVELS.map(a => (
                <button key={a.value} onClick={() => setActivityLevel(a.value)}
                  className={`w-full p-4 rounded-xl text-left transition-all border-2 ${activityLevel === a.value ? 'border-primary bg-primary/10' : 'border-transparent bg-secondary/50'}`}
                >
                  <p className="font-semibold">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Utensils className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Diet Preference</h2>
            </div>
            <div className="space-y-3">
              {DIETS.map(d => (
                <button key={d.value} onClick={() => setDiet(d.value)}
                  className={`w-full p-4 rounded-xl text-left transition-all border-2 flex items-center gap-3 ${diet === d.value ? 'border-primary bg-primary/10' : 'border-transparent bg-secondary/50'}`}
                >
                  <span className="text-2xl">{d.icon}</span>
                  <p className="font-semibold">{d.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="p-4 pb-8 flex gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
        )}
        <Button
          variant="energy"
          className="flex-1 gap-1"
          disabled={!canProceed() || saving}
          onClick={() => {
            if (step < STEPS.length - 1) setStep(s => s + 1);
            else handleFinish();
          }}
        >
          {step === STEPS.length - 1 ? (
            saving ? 'Saving...' : <><Sparkles className="w-4 h-4" /> Get Started</>
          ) : (
            <>Next <ChevronRight className="w-4 h-4" /></>
          )}
        </Button>
      </div>
    </div>
  );
}
