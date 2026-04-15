import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';
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
import AnnouncementBanner from '@/components/AnnouncementBanner';
import AnnouncementPopup from '@/components/AnnouncementPopup';
import ProgressiveOverloadCard from '@/components/ProgressiveOverloadCard';
import GroupChallengesSection from '@/components/GroupChallenges';
import ReferralCard from '@/components/ReferralCard';
import CheckInStatsWidget from '@/components/CheckInStatsWidget';
import StoriesBar from '@/components/StoriesBar';
import { 
  Dumbbell, Flame, Target, TrendingUp, 
  LogOut, User, Activity, Play, CalendarDays, CreditCard,
  Swords, Calendar, ChevronRight, UserCheck
} from 'lucide-react';

export default function Index() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const { todayWorkout } = useWorkouts();
  const { getRecoveryStatus } = useMuscleRecovery();
  const { totals } = useCalories();
  const { getTodaySchedule } = useWeeklySchedule();
  const [showOnboarding, setShowOnboarding] = useState(false);

  if (authLoading || roleLoading) {
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

  // If owner registration is pending, redirect to org setup
  const pendingOwner = localStorage.getItem('pending_owner_registration');
  if (pendingOwner) {
    return <Navigate to="/register-org" replace />;
  }

  // Redirect owners to owner dashboard, admins to admin dashboard
  if (userRole === 'owner') {
    return <Navigate to="/owner" replace />;
  }
  if (userRole === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (userRole === 'trainer') {
    return <Navigate to="/trainer" replace />;
  }

  const needsOnboarding = profile && !(profile as any).onboarding_completed && !profile.fitness_goal;
  if (needsOnboarding && !showOnboarding) {
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
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  return (
    <div className="min-h-screen min-h-dvh app-content">
      {/* Native-style Header with safe area */}
      <header className="native-header px-4 pb-3 flex items-end justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground font-medium">{greeting} 👋</p>
          <h1 className="text-2xl font-extrabold tracking-tight truncate">
            {profile?.name || 'Athlete'}
          </h1>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Link to="/membership">
            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl">
              <User className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      <AnnouncementBanner />
      <AnnouncementPopup />

      <main className="px-4 space-y-4 pb-4">
        {/* Notification Banner */}
        <NotificationBanner />

        {/* Stories */}
        <StoriesBar />

        {/* Check-in Stats */}
        <CheckInStatsWidget />

        {/* Today's Scheduled Workout — Hero Card */}
        <div
          className="glass-card p-5 animate-slide-up overflow-hidden relative"
          style={{ animationDelay: '0s' }}
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">{dayName}'s Plan</span>
              </div>
              <Link to="/schedule" className="text-xs text-primary font-semibold flex items-center gap-0.5">
                Edit <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {todaySchedule?.template ? (
              <div>
                <h2 className="text-xl font-bold mb-1">{todaySchedule.template.name}</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {todaySchedule.template.description || 'Time to hit it!'}
                </p>
                <Link to="/templates">
                  <Button variant="energy" className="w-full gap-2 h-12 text-base font-semibold rounded-xl">
                    <Play className="w-5 h-5" />
                    Start Workout
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-3">
                <p className="text-muted-foreground mb-3">No workout scheduled for today</p>
                <Link to="/schedule">
                  <Button variant="outline" className="h-11 rounded-xl px-6">
                    Plan Your Week
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats — 2 col */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Today</span>
            </div>
            <p className="text-3xl font-extrabold">{exerciseCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">exercises logged</p>
          </div>

          <div className="glass-card p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Flame className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Calories</span>
            </div>
            <p className="text-3xl font-extrabold">{totals.calories}</p>
            <p className="text-xs text-muted-foreground mt-0.5">of {calorieTarget} kcal</p>
            <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
                style={{ width: `${calorieProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Level & Rank Section */}
        <p className="section-header" style={{ animationDelay: '0.12s' }}>Progress</p>
        <LevelProgress />
        <TierCard />

        {/* Streak */}
        <WorkoutStreakCard />

        {/* Live Gym Occupancy */}
        <GymOccupancyMeter />

        {/* Today's Macros */}
        <div className="glass-card p-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-accent" />
            Today's Macros
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-primary/10">
              <p className="text-2xl font-extrabold text-primary">{Math.round(totals.protein)}g</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">Protein</p>
            </div>
            <div className="p-3 rounded-xl bg-accent/10">
              <p className="text-2xl font-extrabold text-accent">{Math.round(totals.carbs)}g</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">Carbs</p>
            </div>
            <div className="p-3 rounded-xl bg-warning/10">
              <p className="text-2xl font-extrabold text-warning">{Math.round(totals.fats)}g</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">Fats</p>
            </div>
          </div>
        </div>

        {/* Muscle Recovery Suggestions */}
        <div className="glass-card p-4 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-primary" />
            Suggested for Today
          </h3>
          <div className="flex flex-wrap gap-2">
            {suggestedMuscles.map((muscle) => (
              <span 
                key={muscle.value}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold ${muscle.color} text-white`}
              >
                {muscle.label}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            These muscle groups are recovered and ready for training
          </p>
        </div>

        {/* Muscle Heatmap */}
        <MuscleHeatmap />

        {/* Recovery Status Grid */}
        <div className="glass-card p-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="font-semibold mb-3 text-sm">Recovery Status</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {MUSCLE_GROUPS.map((muscle) => {
              const status = getRecoveryStatus(muscle.value);
              return (
                <div 
                  key={muscle.value} 
                  className="text-center p-2.5 rounded-xl bg-secondary/50"
                >
                  <div 
                    className={`w-3 h-3 rounded-full mx-auto mb-1.5 ${
                      status.status === 'recovered' ? 'bg-accent' :
                      status.status === 'recovering' ? 'bg-warning' : 'bg-muted-foreground'
                    }`}
                  />
                  <p className="text-[11px] font-medium truncate">{muscle.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progressive Overload */}
        <ProgressiveOverloadCard />

        {/* Quick Feature Links */}
        <p className="section-header">Quick Access</p>
        <div className="grid grid-cols-4 gap-3">
          <Link to="/classes">
            <div className="glass-card p-3 text-center active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[10px] font-semibold">Classes</span>
            </div>
          </Link>
          <Link to="/pt-sessions">
            <div className="glass-card p-3 text-center active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center mx-auto mb-2">
                <UserCheck className="w-5 h-5 text-accent" />
              </div>
              <span className="text-[10px] font-semibold">PT Book</span>
            </div>
          </Link>
          <Link to="/duels">
            <div className="glass-card p-3 text-center active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center mx-auto mb-2">
                <Swords className="w-5 h-5 text-warning" />
              </div>
              <span className="text-[10px] font-semibold">Duels</span>
            </div>
          </Link>
          <Link to="/mobility">
            <div className="glass-card p-3 text-center active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-2">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[10px] font-semibold">Mobility</span>
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

        {/* Referral Program */}
        <ReferralCard />
      </main>

      <BottomNav />
    </div>
  );
}
