import { useState, useEffect } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useFollows } from '@/hooks/useFollows';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FitnessGoal, ActivityLevel, DietPreference } from '@/types/fitness';
import ThemeToggle from '@/components/ThemeToggle';
import AvatarUpload from '@/components/AvatarUpload';
import { 
  User, ChevronLeft, Save, LogOut, 
  Activity, Dumbbell, Utensils, Plus, Loader2, Target, Scale,
  Bell, Ruler, ChevronRight, Users, CalendarDays, Shield, MessageSquare
} from 'lucide-react';
import ChangePassword from '@/components/ChangePassword';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useIsAdmin, useIsTrainer } from '@/hooks/useUserRole';

const FITNESS_GOALS: { value: FitnessGoal; label: string; description: string }[] = [
  { value: 'muscle_gain', label: 'Muscle Gain', description: 'Build lean muscle mass' },
  { value: 'fat_loss', label: 'Fat Loss', description: 'Lose weight and burn fat' },
  { value: 'strength', label: 'Strength', description: 'Increase power and strength' },
  { value: 'maintenance', label: 'Maintenance', description: 'Maintain current physique' },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; multiplier: number }[] = [
  { value: 'sedentary', label: 'Sedentary', multiplier: 1.2 },
  { value: 'light', label: 'Lightly Active', multiplier: 1.375 },
  { value: 'moderate', label: 'Moderately Active', multiplier: 1.55 },
  { value: 'active', label: 'Very Active', multiplier: 1.725 },
  { value: 'very_active', label: 'Extremely Active', multiplier: 1.9 },
];

const DIET_PREFERENCES: { value: DietPreference; label: string; icon: string }[] = [
  { value: 'non_veg', label: 'Non-Vegetarian', icon: '🍗' },
  { value: 'veg', label: 'Vegetarian', icon: '🥗' },
  { value: 'vegan', label: 'Vegan', icon: '🌱' },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, isLoading, updateProfile } = useProfile();
  const { followersCount, followingCount } = useFollows();
  const { isAdmin } = useIsAdmin();
  const { isTrainer } = useIsTrainer();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [heightCm, setHeightCm] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal | ''>('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>('');
  const [dietPreference, setDietPreference] = useState<DietPreference | ''>('');
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState<number | ''>('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setAge(profile.age || '');
      setGender(profile.gender || '');
      setHeightCm(profile.height_cm || '');
      setWeightKg(profile.weight_kg || '');
      setFitnessGoal(profile.fitness_goal || '');
      setActivityLevel(profile.activity_level || '');
      setDietPreference(profile.diet_preference || '');
      setDailyCalorieTarget(profile.daily_calorie_target || '');
    }
  }, [profile]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-glow p-4 rounded-full bg-primary/20">
          <User className="w-8 h-8 text-primary animate-float" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Calculate BMR and TDEE
  const calculateCalories = () => {
    if (!age || !heightCm || !weightKg || !gender || !activityLevel) return;

    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * (weightKg as number) + 6.25 * (heightCm as number) - 5 * (age as number) + 5;
    } else {
      bmr = 10 * (weightKg as number) + 6.25 * (heightCm as number) - 5 * (age as number) - 161;
    }

    const activityData = ACTIVITY_LEVELS.find(a => a.value === activityLevel);
    let tdee = bmr * (activityData?.multiplier || 1.55);

    // Adjust for goal
    if (fitnessGoal === 'fat_loss') {
      tdee -= 500; // Deficit for fat loss
    } else if (fitnessGoal === 'muscle_gain') {
      tdee += 300; // Surplus for muscle gain
    }

    setDailyCalorieTarget(Math.round(tdee));
    toast.success('Calorie target calculated!');
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        name: name || null,
        age: (age as number) || null,
        gender: gender || null,
        height_cm: (heightCm as number) || null,
        weight_kg: (weightKg as number) || null,
        fitness_goal: fitnessGoal || null,
        activity_level: activityLevel || null,
        diet_preference: dietPreference || null,
        daily_calorie_target: (dailyCalorieTarget as number) || null,
      });
      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="p-4 flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Profile</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={signOut}>
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <main className="px-4 space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center py-4 animate-slide-up">
          <AvatarUpload 
            currentAvatarUrl={profile?.avatar_url}
            name={profile?.name}
            size="lg"
            onUploadComplete={() => queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })}
          />
          <h2 className="mt-3 text-lg font-semibold">{profile?.name || 'Your Name'}</h2>
          <p className="text-sm text-muted-foreground">{profile?.fitness_goal?.replace('_', ' ') || 'Set your goal'}</p>
          
          {/* Followers/Following Stats */}
          <div className="flex items-center gap-6 mt-3">
            <button 
              onClick={() => navigate(`/follow/${user?.id}/followers`)}
              className="text-center hover:opacity-80 transition-opacity"
            >
              <p className="text-lg font-bold">{followersCount}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </button>
            <div className="w-px h-8 bg-border" />
            <button 
              onClick={() => navigate(`/follow/${user?.id}/following`)}
              className="text-center hover:opacity-80 transition-opacity"
            >
              <p className="text-lg font-bold">{followingCount}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up">
          <Link to="/attendance" className="glass rounded-xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
            <div className="p-2 rounded-lg bg-green-500/20">
              <CalendarDays className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">Attendance</p>
              <p className="text-xs text-muted-foreground">Check-in tracking</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>

          <Link to="/leaderboard" className="glass rounded-xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Users className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">Leaderboard</p>
              <p className="text-xs text-muted-foreground">Rankings</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>

          <Link to="/rewards" className="glass rounded-xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">Rewards</p>
              <p className="text-xs text-muted-foreground">Redeem points</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>
          
          <Link to="/measurements" className="glass rounded-xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
            <div className="p-2 rounded-lg bg-accent/20">
              <Ruler className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">Measurements</p>
              <p className="text-xs text-muted-foreground">Track progress</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>
          
          <Link to="/reminders" className="glass rounded-xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
            <div className="p-2 rounded-lg bg-primary/20">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">Reminders</p>
              <p className="text-xs text-muted-foreground">Set schedule</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>

          <Link to="/friends" className="glass rounded-xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
            <div className="p-2 rounded-lg bg-destructive/20">
              <Users className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">Friends</p>
              <p className="text-xs text-muted-foreground">Compare PRs</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>

          <Link to="/support" className="glass rounded-xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">Support</p>
              <p className="text-xs text-muted-foreground">Get help</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>

          {/* Change Password */}
          <ChangePassword />

          {(isAdmin || isTrainer) && (
            <Link to="/admin" className="glass rounded-xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform col-span-2 border border-primary/30">
              <div className="p-2 rounded-lg bg-primary/20">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">Admin Dashboard</p>
                <p className="text-xs text-muted-foreground">Manage users & support</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </Link>
          )}
        </div>

        {/* Basic Info */}
        <div className="glass rounded-xl p-4 animate-slide-up">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Basic Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Name</label>
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Age</label>
                <Input
                  type="number"
                  placeholder="25"
                  value={age}
                  onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Gender</label>
                <div className="flex gap-2">
                  {['male', 'female', 'other'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g as 'male' | 'female' | 'other')}
                      className={`flex-1 py-2 rounded-lg text-sm capitalize transition-all ${
                        gender === g
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body Metrics */}
        <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-accent" />
            Body Metrics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Height (cm)</label>
              <Input
                type="number"
                placeholder="175"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Weight (kg)</label>
              <Input
                type="number"
                placeholder="70"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
          </div>
        </div>

        {/* Fitness Goal */}
        <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Fitness Goal
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {FITNESS_GOALS.map((goal) => (
              <button
                key={goal.value}
                onClick={() => setFitnessGoal(goal.value)}
                className={`p-3 rounded-xl text-left transition-all ${
                  fitnessGoal === goal.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                <p className="font-medium text-sm">{goal.label}</p>
                <p className={`text-xs ${fitnessGoal === goal.value ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {goal.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Activity Level */}
        <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Activity Level
          </h3>
          <div className="space-y-2">
            {ACTIVITY_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => setActivityLevel(level.value)}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  activityLevel === level.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                <p className="font-medium text-sm">{level.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Diet Preference */}
        <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-warning" />
            Diet Preference
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {DIET_PREFERENCES.map((diet) => (
              <button
                key={diet.value}
                onClick={() => setDietPreference(diet.value)}
                className={`p-4 rounded-xl text-center transition-all ${
                  dietPreference === diet.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                <span className="text-2xl block mb-1">{diet.icon}</span>
                <p className="text-xs font-medium">{diet.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Calorie Target */}
        <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <h3 className="font-semibold mb-4">Daily Calorie Target</h3>
          <div className="flex gap-3">
            <Input
              type="number"
              placeholder="2000"
              value={dailyCalorieTarget}
              onChange={(e) => setDailyCalorieTarget(e.target.value ? Number(e.target.value) : '')}
              className="flex-1"
            />
            <Button variant="outline" onClick={calculateCalories}>
              Auto Calculate
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Based on your metrics and activity level
          </p>
        </div>

        {/* Save Button */}
        <Button 
          variant="energy" 
          className="w-full" 
          onClick={handleSave}
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Profile
        </Button>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border px-4 py-3">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          <Link to="/" className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors">
            <Activity className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link to="/workout" className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors">
            <Dumbbell className="w-6 h-6" />
            <span className="text-xs mt-1">Workout</span>
          </Link>
          <Link to="/workout" className="relative -top-4">
            <Button variant="energy" size="icon" className="w-14 h-14 rounded-full shadow-lg">
              <Plus className="w-7 h-7" />
            </Button>
          </Link>
          <Link to="/nutrition" className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors">
            <Utensils className="w-6 h-6" />
            <span className="text-xs mt-1">Food</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center text-primary">
            <User className="w-6 h-6" />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
