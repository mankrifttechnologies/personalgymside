export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'legs' | 'abs';

export type FitnessGoal = 'muscle_gain' | 'fat_loss' | 'strength' | 'maintenance';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type DietPreference = 'veg' | 'non_veg' | 'vegan';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  gender: 'male' | 'female' | 'other' | null;
  fitness_goal: FitnessGoal | null;
  activity_level: ActivityLevel | null;
  diet_preference: DietPreference | null;
  daily_calorie_target: number | null;
  avatar_url: string | null;
  xp: number | null;
  level: number | null;
  is_approved: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  workout_date: string;
  notes: string | null;
  total_duration_minutes: number | null;
  calories_burned: number | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  muscle_group: MuscleGroup;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
  created_at: string;
}

export interface CalorieEntry {
  id: string;
  user_id: string;
  entry_date: string;
  meal_type: MealType | null;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  created_at: string;
}

export interface MuscleRecovery {
  id: string;
  user_id: string;
  muscle_group: MuscleGroup;
  last_trained_date: string;
  created_at: string;
  updated_at: string;
}

export const MUSCLE_GROUPS: { value: MuscleGroup; label: string; color: string }[] = [
  { value: 'chest', label: 'Chest', color: 'bg-muscle-chest' },
  { value: 'back', label: 'Back', color: 'bg-muscle-back' },
  { value: 'shoulders', label: 'Shoulders', color: 'bg-muscle-shoulders' },
  { value: 'biceps', label: 'Biceps', color: 'bg-muscle-biceps' },
  { value: 'triceps', label: 'Triceps', color: 'bg-muscle-triceps' },
  { value: 'legs', label: 'Legs', color: 'bg-muscle-legs' },
  { value: 'abs', label: 'Abs', color: 'bg-muscle-abs' },
];

export const EXERCISE_SUGGESTIONS: Record<MuscleGroup, string[]> = {
  chest: ['Bench Press', 'Incline Press', 'Dumbbell Flyes', 'Push-ups', 'Cable Crossover', 'Decline Press'],
  back: ['Lat Pulldown', 'Barbell Row', 'Deadlift', 'Pull-ups', 'Cable Row', 'T-Bar Row'],
  shoulders: ['Overhead Press', 'Lateral Raises', 'Front Raises', 'Rear Delt Flyes', 'Arnold Press', 'Shrugs'],
  biceps: ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl', 'Cable Curl', 'Concentration Curl'],
  triceps: ['Tricep Pushdown', 'Skull Crushers', 'Dips', 'Close Grip Bench', 'Overhead Extension', 'Kickbacks'],
  legs: ['Squats', 'Leg Press', 'Lunges', 'Leg Curl', 'Leg Extension', 'Calf Raises', 'Romanian Deadlift'],
  abs: ['Crunches', 'Plank', 'Leg Raises', 'Russian Twists', 'Cable Crunch', 'Ab Wheel'],
};
