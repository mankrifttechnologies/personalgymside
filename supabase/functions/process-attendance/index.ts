import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BiometricInput {
  memberId: string // member_code like "FIT12345"
  deviceId: string
  timestamp: string
  type: 'check-in' | 'check-out'
}

interface AttendanceResult {
  success: boolean
  message: string
  data?: any
  pointsAwarded?: number
  streakUpdated?: boolean
  badgeEarned?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const input: BiometricInput = await req.json()
    console.log('Processing attendance input:', input)

    // Validate input
    if (!input.memberId || !input.deviceId || !input.timestamp || !input.type) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid input data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find member by member_code
    const { data: member, error: memberError } = await supabase
      .from('gym_members')
      .select('id, user_id, member_code, status')
      .eq('member_code', input.memberId)
      .single()

    if (memberError || !member) {
      console.error('Member not found:', memberError)
      return new Response(
        JSON.stringify({ success: false, message: 'Member not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (member.status !== 'active') {
      return new Response(
        JSON.stringify({ success: false, message: 'Member is not active' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await processAttendance(supabase, member, input)
    
    return new Response(
      JSON.stringify(result),
      { status: result.success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error processing attendance:', error)
    return new Response(
      JSON.stringify({ success: false, message: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processAttendance(
  supabase: any, 
  member: any, 
  input: BiometricInput
): Promise<AttendanceResult> {
  const timestamp = new Date(input.timestamp)
  const today = timestamp.toISOString().split('T')[0]
  
  // Check for existing check-in today
  const { data: existingLogs } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('member_id', member.id)
    .gte('check_in_time', `${today}T00:00:00`)
    .lte('check_in_time', `${today}T23:59:59`)
    .order('check_in_time', { ascending: false })
    .limit(1)

  const latestLog = existingLogs?.[0]

  if (input.type === 'check-in') {
    // Prevent duplicate check-in without checkout
    if (latestLog && latestLog.status === 'checked_in') {
      return {
        success: false,
        message: 'Already checked in. Please check out first.'
      }
    }

    // Determine if on-time (before 9 AM is considered on-time)
    const hour = timestamp.getHours()
    const isOnTime = hour < 9

    // Create new attendance log
    const { data: newLog, error: insertError } = await supabase
      .from('attendance_logs')
      .insert({
        member_id: member.id,
        check_in_time: input.timestamp,
        device_id: input.deviceId,
        status: 'checked_in',
        is_on_time: isOnTime
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating attendance log:', insertError)
      return { success: false, message: 'Failed to record check-in' }
    }

    // Award points and update streaks
    const pointsResult = await awardAttendancePoints(supabase, member.id, isOnTime)
    const streakResult = await updateStreak(supabase, member.id, today)
    const badgeResult = await checkAndAwardBadges(supabase, member.id, streakResult.currentStreak)

    return {
      success: true,
      message: `Check-in successful! ${isOnTime ? 'On-time bonus applied!' : ''}`,
      data: newLog,
      pointsAwarded: pointsResult.points,
      streakUpdated: true,
      badgeEarned: badgeResult.newBadge
    }

  } else if (input.type === 'check-out') {
    if (!latestLog || latestLog.status !== 'checked_in') {
      return {
        success: false,
        message: 'No active check-in found. Please check in first.'
      }
    }

    const checkInTime = new Date(latestLog.check_in_time)
    const durationMinutes = Math.round((timestamp.getTime() - checkInTime.getTime()) / 60000)

    // Update the existing log with checkout
    const { data: updatedLog, error: updateError } = await supabase
      .from('attendance_logs')
      .update({
        check_out_time: input.timestamp,
        status: 'checked_out',
        duration_minutes: durationMinutes
      })
      .eq('id', latestLog.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating attendance log:', updateError)
      return { success: false, message: 'Failed to record check-out' }
    }

    return {
      success: true,
      message: `Check-out successful! Workout duration: ${durationMinutes} minutes`,
      data: updatedLog
    }
  }

  return { success: false, message: 'Invalid check type' }
}

async function awardAttendancePoints(
  supabase: any, 
  memberId: string, 
  isOnTime: boolean
): Promise<{ points: number }> {
  let pointsToAward = 10 // Base attendance points
  
  if (isOnTime) {
    pointsToAward += 2 // On-time bonus
  }

  // Get wallet
  const { data: wallet } = await supabase
    .from('points_wallet')
    .select('*')
    .eq('member_id', memberId)
    .single()

  if (!wallet) {
    console.error('Wallet not found for member:', memberId)
    return { points: 0 }
  }

  // Update wallet balance
  await supabase
    .from('points_wallet')
    .update({
      balance: wallet.balance + pointsToAward,
      total_earned: wallet.total_earned + pointsToAward
    })
    .eq('id', wallet.id)

  // Record transaction
  await supabase
    .from('points_transactions')
    .insert({
      wallet_id: wallet.id,
      amount: pointsToAward,
      transaction_type: 'earn',
      description: isOnTime ? 'Daily attendance + On-time bonus' : 'Daily attendance'
    })

  return { points: pointsToAward }
}

async function updateStreak(
  supabase: any, 
  memberId: string, 
  today: string
): Promise<{ currentStreak: number; longestStreak: number }> {
  const { data: streak } = await supabase
    .from('member_streaks')
    .select('*')
    .eq('member_id', memberId)
    .single()

  if (!streak) {
    return { currentStreak: 0, longestStreak: 0 }
  }

  const lastDate = streak.last_attendance_date ? new Date(streak.last_attendance_date) : null
  const todayDate = new Date(today)
  
  let newCurrentStreak = streak.current_streak
  let newLongestStreak = streak.longest_streak
  let newStreakStartDate = streak.streak_start_date

  if (!lastDate) {
    // First attendance ever
    newCurrentStreak = 1
    newStreakStartDate = today
  } else {
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      // Already attended today, no streak change
    } else if (diffDays === 1) {
      // Consecutive day - increase streak
      newCurrentStreak = streak.current_streak + 1
      
      // Check for streak bonuses
      if (newCurrentStreak === 7) {
        await awardStreakBonus(supabase, memberId, 5, '7-day streak bonus')
      } else if (newCurrentStreak === 30) {
        await awardStreakBonus(supabase, memberId, 20, '30-day streak bonus')
      }
    } else {
      // Streak broken
      newCurrentStreak = 1
      newStreakStartDate = today
      
      // Check for penalty (missing 3+ days)
      if (diffDays >= 3) {
        await awardStreakBonus(supabase, memberId, -5, 'Penalty: 3+ days missed')
      }
    }
  }

  newLongestStreak = Math.max(newCurrentStreak, newLongestStreak)

  await supabase
    .from('member_streaks')
    .update({
      current_streak: newCurrentStreak,
      longest_streak: newLongestStreak,
      last_attendance_date: today,
      streak_start_date: newStreakStartDate
    })
    .eq('member_id', memberId)

  return { currentStreak: newCurrentStreak, longestStreak: newLongestStreak }
}

async function awardStreakBonus(
  supabase: any, 
  memberId: string, 
  points: number, 
  description: string
) {
  const { data: wallet } = await supabase
    .from('points_wallet')
    .select('*')
    .eq('member_id', memberId)
    .single()

  if (!wallet) return

  const newBalance = Math.max(0, wallet.balance + points)
  const newTotalEarned = points > 0 ? wallet.total_earned + points : wallet.total_earned

  await supabase
    .from('points_wallet')
    .update({
      balance: newBalance,
      total_earned: newTotalEarned
    })
    .eq('id', wallet.id)

  await supabase
    .from('points_transactions')
    .insert({
      wallet_id: wallet.id,
      amount: points,
      transaction_type: points > 0 ? 'bonus' : 'penalty',
      description
    })
}

async function checkAndAwardBadges(
  supabase: any, 
  memberId: string, 
  currentStreak: number
): Promise<{ newBadge?: string }> {
  const badges = [
    { streak: 7, type: 'streak_7', name: 'Week Warrior' },
    { streak: 14, type: 'streak_14', name: 'Two Week Champion' },
    { streak: 30, type: 'streak_30', name: 'Monthly Master' },
    { streak: 60, type: 'streak_60', name: 'Iron Will' },
    { streak: 100, type: 'streak_100', name: 'Legendary' }
  ]

  for (const badge of badges) {
    if (currentStreak >= badge.streak) {
      // Check if already has badge
      const { data: existing } = await supabase
        .from('member_badges')
        .select('id')
        .eq('member_id', memberId)
        .eq('badge_type', badge.type)
        .single()

      if (!existing) {
        await supabase
          .from('member_badges')
          .insert({
            member_id: memberId,
            badge_type: badge.type,
            badge_name: badge.name,
            metadata: { streak_achieved: currentStreak }
          })
        
        return { newBadge: badge.name }
      }
    }
  }

  return {}
}
