import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    // Fetch user data in parallel
    const [profileRes, recoveryRes, workoutsRes, prsRes] = await Promise.all([
      supabaseClient.from("profiles").select("*").eq("user_id", user.id).single(),
      supabaseClient.from("muscle_recovery").select("*").eq("user_id", user.id),
      supabaseClient.from("workouts").select("id, workout_date").eq("user_id", user.id).order("workout_date", { ascending: false }).limit(10),
      supabaseClient.from("personal_records").select("*").eq("user_id", user.id),
    ]);

    const profile = profileRes.data;
    const recovery = recoveryRes.data || [];
    const recentWorkouts = workoutsRes.data || [];
    const prs = prsRes.data || [];

    // Get exercises for recent workouts
    const workoutIds = recentWorkouts.map(w => w.id);
    const { data: recentExercises } = workoutIds.length
      ? await supabaseClient.from("workout_exercises").select("*").in("workout_id", workoutIds)
      : { data: [] };

    // Build recovery map
    const now = new Date();
    const recoveryMap: Record<string, { days: number; status: string }> = {};
    recovery.forEach((r: any) => {
      const days = Math.floor((now.getTime() - new Date(r.last_trained_date).getTime()) / (1000 * 60 * 60 * 24));
      recoveryMap[r.muscle_group] = {
        days,
        status: days >= 3 ? "recovered" : days >= 1 ? "recovering" : "fatigued",
      };
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert fitness coach. Generate a COMPLETE workout plan as a JSON array.
Each exercise must have: exercise_name, muscle_group (one of: chest, back, shoulders, biceps, triceps, legs, abs, glutes), sets, reps, weight_kg (suggested based on PRs or null), rest_seconds, notes.
Return ONLY valid JSON array, no markdown.`;

    const userPrompt = `Build an optimal workout for today.

User Profile:
- Goal: ${profile?.fitness_goal || "general fitness"}
- Level: ${profile?.level || 1}
- Weight: ${profile?.weight_kg || "unknown"}kg

Muscle Recovery Status:
${Object.entries(recoveryMap).map(([m, r]) => `- ${m}: ${r.status} (${r.days} days ago)`).join("\n") || "No recovery data"}

Recent exercises (last 10 workouts):
${(recentExercises || []).slice(0, 20).map((e: any) => `- ${e.exercise_name}: ${e.sets}x${e.reps} @ ${e.weight_kg || 0}kg`).join("\n") || "No recent exercises"}

Personal Records:
${prs.slice(0, 10).map((p: any) => `- ${p.exercise_name}: ${p.max_weight_kg}kg x ${p.max_reps}`).join("\n") || "No PRs yet"}

RULES:
1. ONLY target recovered/fresh muscles
2. Include 4-6 exercises
3. Progressive overload: suggest slightly higher weight/reps than recent history
4. Include warm-up note for first exercise
5. Return JSON array only`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";

    // Parse JSON from response
    let exercises;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      exercises = JSON.parse(cleaned);
    } catch {
      exercises = [];
    }

    return new Response(JSON.stringify({ exercises, recovery: recoveryMap }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Smart workout builder error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
