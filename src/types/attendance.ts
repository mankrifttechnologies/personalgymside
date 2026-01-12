export type AppRole = 'admin' | 'trainer' | 'member';
export type AttendanceStatus = 'checked_in' | 'checked_out' | 'auto_checkout' | 'missed';
export type MemberStatus = 'active' | 'inactive' | 'suspended' | 'banned';
export type RedemptionStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled';

export interface GymMember {
  id: string;
  user_id: string;
  member_code: string;
  status: MemberStatus;
  batch: string | null;
  trainer_id: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceLog {
  id: string;
  member_id: string;
  check_in_time: string;
  check_out_time: string | null;
  device_id: string | null;
  status: AttendanceStatus;
  duration_minutes: number | null;
  is_on_time: boolean;
  notes: string | null;
  created_at: string;
  gym_members?: Partial<GymMember>;
}

export interface MemberStreak {
  id: string;
  member_id: string;
  current_streak: number;
  longest_streak: number;
  last_attendance_date: string | null;
  streak_start_date: string | null;
  updated_at: string;
}

export interface MemberRanking {
  id: string;
  member_id: string;
  rank_date: string;
  daily_rank: number | null;
  weekly_rank: number | null;
  monthly_rank: number | null;
  all_time_rank: number | null;
  total_attendance_days: number;
  consistency_score: number;
  on_time_percentage: number;
  created_at: string;
}

export interface PointsWallet {
  id: string;
  member_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  updated_at: string;
}

export interface PointsTransaction {
  id: string;
  wallet_id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface RewardsCatalog {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  category: string;
  image_url: string | null;
  stock: number | null;
  is_active: boolean;
  created_at: string;
}

export interface RewardRedemption {
  id: string;
  member_id: string;
  reward_id: string;
  points_spent: number;
  status: RedemptionStatus;
  admin_notes: string | null;
  redeemed_at: string;
  fulfilled_at: string | null;
  rewards_catalog?: RewardsCatalog;
}

export interface MemberBadge {
  id: string;
  member_id: string;
  badge_type: string;
  badge_name: string;
  earned_at: string;
  metadata: Record<string, any> | null;
  metadata: Record<string, any>;
}

export interface BiometricDevice {
  id: string;
  device_id: string;
  name: string;
  location: string | null;
  status: string;
  last_sync: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface BiometricInput {
  memberId: string;
  deviceId: string;
  timestamp: string;
  type: 'check-in' | 'check-out';
}

export interface LeaderboardEntry {
  member_id: string;
  member_code: string;
  name: string;
  avatar_url: string | null;
  current_streak: number;
  longest_streak: number;
  total_attendance_days: number;
  points_balance: number;
  rank: number;
}

export interface AttendanceStats {
  totalDays: number;
  thisMonth: number;
  thisWeek: number;
  averageDuration: number;
  onTimePercentage: number;
  peakHour: number;
}
