export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      attendance_logs: {
        Row: {
          check_in_time: string
          check_out_time: string | null
          created_at: string
          device_id: string | null
          duration_minutes: number | null
          id: string
          is_on_time: boolean | null
          member_id: string
          notes: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
        }
        Insert: {
          check_in_time: string
          check_out_time?: string | null
          created_at?: string
          device_id?: string | null
          duration_minutes?: number | null
          id?: string
          is_on_time?: boolean | null
          member_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Update: {
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string
          device_id?: string | null
          duration_minutes?: number | null
          id?: string
          is_on_time?: boolean | null
          member_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gym_members"
            referencedColumns: ["id"]
          },
        ]
      }
      biometric_devices: {
        Row: {
          created_at: string
          device_id: string
          id: string
          last_sync: string | null
          location: string | null
          metadata: Json | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          last_sync?: string | null
          location?: string | null
          metadata?: Json | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          last_sync?: string | null
          location?: string | null
          metadata?: Json | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      body_measurements: {
        Row: {
          biceps_cm: number | null
          body_fat_percentage: number | null
          chest_cm: number | null
          created_at: string
          hips_cm: number | null
          id: string
          measurement_date: string
          notes: string | null
          thighs_cm: number | null
          user_id: string
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          biceps_cm?: number | null
          body_fat_percentage?: number | null
          chest_cm?: number | null
          created_at?: string
          hips_cm?: number | null
          id?: string
          measurement_date?: string
          notes?: string | null
          thighs_cm?: number | null
          user_id: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          biceps_cm?: number | null
          body_fat_percentage?: number | null
          chest_cm?: number | null
          created_at?: string
          hips_cm?: number | null
          id?: string
          measurement_date?: string
          notes?: string | null
          thighs_cm?: number | null
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      calorie_entries: {
        Row: {
          calories: number
          carbs_g: number | null
          created_at: string | null
          entry_date: string
          fats_g: number | null
          food_name: string
          id: string
          meal_type: string | null
          protein_g: number | null
          user_id: string
        }
        Insert: {
          calories?: number
          carbs_g?: number | null
          created_at?: string | null
          entry_date?: string
          fats_g?: number | null
          food_name: string
          id?: string
          meal_type?: string | null
          protein_g?: number | null
          user_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number | null
          created_at?: string | null
          entry_date?: string
          fats_g?: number | null
          food_name?: string
          id?: string
          meal_type?: string | null
          protein_g?: number | null
          user_id?: string
        }
        Relationships: []
      }
      exercise_library: {
        Row: {
          created_at: string
          description: string | null
          id: string
          instructions: string | null
          is_system: boolean
          muscle_group: string
          name: string
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string | null
          is_system?: boolean
          muscle_group: string
          name: string
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string | null
          is_system?: boolean
          muscle_group?: string
          name?: string
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gym_members: {
        Row: {
          batch: string | null
          created_at: string
          id: string
          joined_at: string
          member_code: string
          status: Database["public"]["Enums"]["member_status"]
          trainer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          batch?: string | null
          created_at?: string
          id?: string
          joined_at?: string
          member_code: string
          status?: Database["public"]["Enums"]["member_status"]
          trainer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          batch?: string | null
          created_at?: string
          id?: string
          joined_at?: string
          member_code?: string
          status?: Database["public"]["Enums"]["member_status"]
          trainer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          meals: Json
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          meals?: Json
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          meals?: Json
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      member_badges: {
        Row: {
          badge_name: string
          badge_type: string
          earned_at: string
          id: string
          member_id: string
          metadata: Json | null
        }
        Insert: {
          badge_name: string
          badge_type: string
          earned_at?: string
          id?: string
          member_id: string
          metadata?: Json | null
        }
        Update: {
          badge_name?: string
          badge_type?: string
          earned_at?: string
          id?: string
          member_id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "member_badges_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gym_members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      member_rankings: {
        Row: {
          all_time_rank: number | null
          consistency_score: number
          created_at: string
          daily_rank: number | null
          id: string
          member_id: string
          monthly_rank: number | null
          on_time_percentage: number
          rank_date: string
          total_attendance_days: number
          weekly_rank: number | null
        }
        Insert: {
          all_time_rank?: number | null
          consistency_score?: number
          created_at?: string
          daily_rank?: number | null
          id?: string
          member_id: string
          monthly_rank?: number | null
          on_time_percentage?: number
          rank_date?: string
          total_attendance_days?: number
          weekly_rank?: number | null
        }
        Update: {
          all_time_rank?: number | null
          consistency_score?: number
          created_at?: string
          daily_rank?: number | null
          id?: string
          member_id?: string
          monthly_rank?: number | null
          on_time_percentage?: number
          rank_date?: string
          total_attendance_days?: number
          weekly_rank?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "member_rankings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gym_members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_streaks: {
        Row: {
          current_streak: number
          id: string
          last_attendance_date: string | null
          longest_streak: number
          member_id: string
          streak_start_date: string | null
          updated_at: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_attendance_date?: string | null
          longest_streak?: number
          member_id: string
          streak_start_date?: string | null
          updated_at?: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_attendance_date?: string | null
          longest_streak?: number
          member_id?: string
          streak_start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_streaks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "gym_members"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      muscle_recovery: {
        Row: {
          created_at: string | null
          id: string
          last_trained_date: string
          muscle_group: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_trained_date: string
          muscle_group: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_trained_date?: string
          muscle_group?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          achieved_date: string
          created_at: string
          exercise_name: string
          id: string
          max_reps: number
          max_weight_kg: number
          muscle_group: string
          updated_at: string
          user_id: string
        }
        Insert: {
          achieved_date?: string
          created_at?: string
          exercise_name: string
          id?: string
          max_reps?: number
          max_weight_kg: number
          muscle_group: string
          updated_at?: string
          user_id: string
        }
        Update: {
          achieved_date?: string
          created_at?: string
          exercise_name?: string
          id?: string
          max_reps?: number
          max_weight_kg?: number
          muscle_group?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      points_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          transaction_type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "points_wallet"
            referencedColumns: ["id"]
          },
        ]
      }
      points_wallet: {
        Row: {
          balance: number
          id: string
          member_id: string
          total_earned: number
          total_spent: number
          updated_at: string
        }
        Insert: {
          balance?: number
          id?: string
          member_id: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          id?: string
          member_id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_wallet_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "gym_members"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          avatar_url: string | null
          created_at: string | null
          daily_calorie_target: number | null
          diet_preference: string | null
          fitness_goal: string | null
          friend_code: string | null
          gender: string | null
          height_cm: number | null
          id: string
          is_public: boolean | null
          level: number | null
          name: string | null
          updated_at: string | null
          user_id: string
          weight_kg: number | null
          xp: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          avatar_url?: string | null
          created_at?: string | null
          daily_calorie_target?: number | null
          diet_preference?: string | null
          fitness_goal?: string | null
          friend_code?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          is_public?: boolean | null
          level?: number | null
          name?: string | null
          updated_at?: string | null
          user_id: string
          weight_kg?: number | null
          xp?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          avatar_url?: string | null
          created_at?: string | null
          daily_calorie_target?: number | null
          diet_preference?: string | null
          fitness_goal?: string | null
          friend_code?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          is_public?: boolean | null
          level?: number | null
          name?: string | null
          updated_at?: string | null
          user_id?: string
          weight_kg?: number | null
          xp?: number | null
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          admin_notes: string | null
          fulfilled_at: string | null
          id: string
          member_id: string
          points_spent: number
          redeemed_at: string
          reward_id: string
          status: Database["public"]["Enums"]["reward_redemption_status"]
        }
        Insert: {
          admin_notes?: string | null
          fulfilled_at?: string | null
          id?: string
          member_id: string
          points_spent: number
          redeemed_at?: string
          reward_id: string
          status?: Database["public"]["Enums"]["reward_redemption_status"]
        }
        Update: {
          admin_notes?: string | null
          fulfilled_at?: string | null
          id?: string
          member_id?: string
          points_spent?: number
          redeemed_at?: string
          reward_id?: string
          status?: Database["public"]["Enums"]["reward_redemption_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "gym_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards_catalog: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          points_cost: number
          stock: number | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          points_cost: number
          stock?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          points_cost?: number
          stock?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string
          current_progress: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      water_entries: {
        Row: {
          amount_ml: number
          created_at: string
          entry_date: string
          id: string
          user_id: string
        }
        Insert: {
          amount_ml?: number
          created_at?: string
          entry_date?: string
          id?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          entry_date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          start_date: string
          target_value: number
          title: string
          xp_reward: number
        }
        Insert: {
          challenge_type: string
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          start_date: string
          target_value: number
          title: string
          xp_reward?: number
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          start_date?: string
          target_value?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      weekly_schedule: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_schedule_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          created_at: string | null
          exercise_name: string
          id: string
          muscle_group: string
          reps: number
          sets: number
          weight_kg: number | null
          workout_id: string
        }
        Insert: {
          created_at?: string | null
          exercise_name: string
          id?: string
          muscle_group: string
          reps?: number
          sets?: number
          weight_kg?: number | null
          workout_id: string
        }
        Update: {
          created_at?: string | null
          exercise_name?: string
          id?: string
          muscle_group?: string
          reps?: number
          sets?: number
          weight_kg?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_reminders: {
        Row: {
          created_at: string
          days_of_week: number[]
          id: string
          is_enabled: boolean
          reminder_message: string | null
          reminder_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_of_week?: number[]
          id?: string
          is_enabled?: boolean
          reminder_message?: string | null
          reminder_time?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_of_week?: number[]
          id?: string
          is_enabled?: boolean
          reminder_message?: string | null
          reminder_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_template_exercises: {
        Row: {
          created_at: string
          exercise_name: string
          id: string
          muscle_group: string
          notes: string | null
          order_index: number
          reps: number
          sets: number
          template_id: string
        }
        Insert: {
          created_at?: string
          exercise_name: string
          id?: string
          muscle_group: string
          notes?: string | null
          order_index?: number
          reps?: number
          sets?: number
          template_id: string
        }
        Update: {
          created_at?: string
          exercise_name?: string
          id?: string
          muscle_group?: string
          notes?: string | null
          order_index?: number
          reps?: number
          sets?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_template_exercises_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      workouts: {
        Row: {
          calories_burned: number | null
          created_at: string | null
          id: string
          notes: string | null
          total_duration_minutes: number | null
          updated_at: string | null
          user_id: string
          workout_date: string
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          total_duration_minutes?: number | null
          updated_at?: string | null
          user_id: string
          workout_date: string
        }
        Update: {
          calories_burned?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          total_duration_minutes?: number | null
          updated_at?: string | null
          user_id?: string
          workout_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_id_by_friend_code: { Args: { code: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "trainer" | "member"
      attendance_status:
        | "checked_in"
        | "checked_out"
        | "auto_checkout"
        | "missed"
      member_status: "active" | "inactive" | "suspended" | "banned"
      reward_redemption_status:
        | "pending"
        | "approved"
        | "rejected"
        | "fulfilled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "trainer", "member"],
      attendance_status: [
        "checked_in",
        "checked_out",
        "auto_checkout",
        "missed",
      ],
      member_status: ["active", "inactive", "suspended", "banned"],
      reward_redemption_status: [
        "pending",
        "approved",
        "rejected",
        "fulfilled",
      ],
    },
  },
} as const
