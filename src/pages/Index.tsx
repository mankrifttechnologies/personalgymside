import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useWorkouts, useMuscleRecovery } from '@/hooks/useWorkouts';
import { useCalories } from '@/hooks/useCalories';
import { useWeeklySchedule } from '@/hooks/useWeeklySchedule';
import { Button } from '@/components/ui/button';
import { MUSCLE_GROUPS } from '@/types/fitness';
import BottomNav from '@/components/BottomNav';
import WorkoutStreakCard from '@/components/WorkoutStreakCard';
import NotificationBanner from '@/components/NotificationBanner';
import LevelProgress from '@/components/LevelProgress';
import BadgeDisplay from '@/components/BadgeDisplay';
import WaterTracker from '@/components/WaterTracker';
import { WeeklyChallenges } from '@/components/WeeklyChallenges';
import { TierCard } from '@/components/TierBadge';
import MuscleHeatmap from '@/components/MuscleHeatmap';
import OnboardingWizard from '@/components/OnboardingWizard';
import GymOccupancyMeter from '@/components/GymOccupancyMeter';
import ProgressiveOverloadCard from '@/components/ProgressiveOverloadCard';
import GroupChallengesSection from '@/components/GroupChallenges';
import { 
  Dumbbell, Flame, Target, TrendingUp, 
  LogOut, User, Activity, Play, CalendarDays, CreditCard,
} from 'lucide-react';

export default function Index() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { todayWorkout } = useWorkouts();
  const { getRecoveryStatus } = useMuscleRecovery();
  const { totals } = useCalories();
  const { getTodaySchedule } = useWeeklySchedule();
  const [showOnboarding, setShowOnboarding] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-glow p-4 rounded-full bg-primary/20">
          <Dumbbell className="w-8 h-8 text-primary animate-float" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show onboarding for new users
  const needsOnboarding = profile && !(profile as any).onboarding_completed && !profile.fitness_goal;
  if (needsOnboarding && !showOnboarding) {
    // Auto-show onboarding
    return <OnboardingWizard onComplete={() => setShowOnboarding(false)} />;
  }
  if (showOnboarding) {
    return <OnboardingWizard onComplete={() => setShowOnboarding(false)} />;
  }

  const exerciseCount = todayWorkout?.workout_exercises?.length || 0;
  const calorieTarget = profile?.daily_calorie_target || 2000;
  const calorieProgress = Math.min((totals.calories / calorieTarget) * 100, 100);
  const todaySchedule = getTodaySchedule();

  const suggestedMuscles = MUSCLE_GROUPS.filter(m => {
    const status = getRecoveryStatus(m.value);
    return status.status === 'recovered' || status.status === 'fresh';
  }).slice(0, 3);

  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20">
            <Dumbbell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">FitAI Coach</h1>
            <p className="text-sm text-muted-foreground">
              Hey, {profile?.name || 'Athlete'}! 💪
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/profile">
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/membership">
            <Button variant="ghost" size="icon">
              <CreditCard className="w-5 h-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="px-4 space-y-6">
        {/* Notification Banner */}
        <NotificationBanner />

        {/* Level Progress */}
        <LevelProgress />

        {/* Tier Rank */}
        <TierCard />

        {/* Workout Streak */}
        <WorkoutStreakCard />

        {/* Live Gym Occupancy */}
        <GymOccupancyMeter />

        {/* Today's Scheduled Workout Widget */}
        <div className="glass rounded-xl p-4 animate-slide-up border-l-4 border-primary">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">{dayName}'s Plan</span>
            </div>
            <Link to="/schedule">
              <Button variant="ghost" size="sm" className="text-xs">
                Edit Schedule
              </Button>
            </Link>
          </div>
          
          {todaySchedule?.template ? (
            <div>
              <h2 className="text-xl font-bold mb-1">{todaySchedule.template.name}</h2>
              <p className="text-sm text-muted-foreground mb-3">
                {todaySchedule.template.description || 'Time to hit it!'}
              </p>
              <Link to="/templates">
                <Button variant="energy" className="w-full gap-2">
                  <Play className="w-4 h-4" />
                  Start Workout
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-muted-foreground mb-2">No workout scheduled</p>
              <Link to="/schedule">
                <Button variant="outline" size="sm">
                  Plan Your Week
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Today's Workout</span>
            </div>
            <p className="text-2xl font-bold">{exerciseCount}</p>
            <p className="text-sm text-muted-foreground">exercises logged</p>
          </div>

          <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Calories</span>
            </div>
            <p className="text-2xl font-bold">{totals.calories}</p>
            <p className="text-sm text-muted-foreground">of {calorieTarget} kcal</p>
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${calorieProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Macros */}
        <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            Today's Macros
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{Math.round(totals.protein)}g</p>
              <p className="text-xs text-muted-foreground">Protein</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">{Math.round(totals.carbs)}g</p>
              <p className="text-xs text-muted-foreground">Carbs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">{Math.round(totals.fats)}g</p>
              <p className="text-xs text-muted-foreground">Fats</p>
            </div>
          </div>
        </div>

        {/* Muscle Recovery */}
        <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Suggested for Today
          </h3>
          <div className="flex flex-wrap gap-2">
            {suggestedMuscles.map((muscle) => (
              <span 
                key={muscle.value}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${muscle.color} text-white`}
              >
                {muscle.label}
              </span>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            These muscle groups are recovered and ready for training!
          </p>
        </div>

        {/* Muscle Heatmap */}
        <MuscleHeatmap />

        {/* Muscle Status Grid */}
        <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="font-semibold mb-3">Recovery Status</h3>
          <div className="grid grid-cols-4 gap-2">
            {MUSCLE_GROUPS.map((muscle) => {
              const status = getRecoveryStatus(muscle.value);
              return (
                <div 
                  key={muscle.value} 
                  className="text-center p-2 rounded-lg bg-secondary/50"
                >
                  <div 
                    className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                      status.status === 'recovered' ? 'bg-accent' :
                      status.status === 'recovering' ? 'bg-warning' : 'bg-muted-foreground'
                    }`}
                  />
                  <p className="text-xs font-medium truncate">{muscle.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progressive Overload */}
        <ProgressiveOverloadCard />

        {/* Quick Feature Links */}
        <div className="grid grid-cols-3 gap-3">
          <Link to="/classes">
            <div className="glass rounded-xl p-4 text-center hover:bg-secondary/50 transition-colors">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
              <span className="text-xs font-medium">Book Class</span>
            </div>
          </Link>
          <Link to="/duels">
            <div className="glass rounded-xl p-4 text-center hover:bg-secondary/50 transition-colors">
              <Swords className="w-6 h-6 mx-auto mb-2 text-accent" />
              <span className="text-xs font-medium">Duels</span>
            </div>
          </Link>
          <Link to="/mobility">
            <div className="glass rounded-xl p-4 text-center hover:bg-secondary/50 transition-colors">
              <Activity className="w-6 h-6 mx-auto mb-2 text-warning" />
              <span className="text-xs font-medium">Mobility</span>
            </div>
          </Link>
        </div>

        {/* Weekly Challenges */}
        <WeeklyChallenges />

        {/* Team Challenges */}
        <GroupChallengesSection />

        {/* Water Tracker */}
        <WaterTracker />

        {/* Achievements */}
        <BadgeDisplay />
      </main>

      <BottomNav />
    </div>
  );
}
