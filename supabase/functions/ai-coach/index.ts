import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, profile, muscleRecovery, recentWorkouts, todayCalories } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "workout_recommendation") {
      systemPrompt = `You are an expert fitness coach and personal trainer. Based on the user's profile, muscle recovery status, and recent workout history, provide personalized workout recommendations.

Key guidelines:
- Avoid suggesting muscle groups that were trained within the last 48-72 hours
- Consider the user's fitness goal (muscle gain, fat loss, strength, or maintenance)
- Suggest appropriate exercises with sets, reps, and weight guidance
- Include warm-up and cool-down suggestions
- Be encouraging and motivational
- Keep responses concise and actionable`;

      userPrompt = `User Profile:
- Name: ${profile?.name || "User"}
- Age: ${profile?.age || "Unknown"}
- Gender: ${profile?.gender || "Unknown"}
- Weight: ${profile?.weight_kg || "Unknown"} kg
- Height: ${profile?.height_cm || "Unknown"} cm
- Fitness Goal: ${profile?.fitness_goal || "general fitness"}
- Activity Level: ${profile?.activity_level || "moderate"}

Muscle Recovery Status (days since last trained):
${muscleRecovery?.map((m: any) => `- ${m.muscle_group}: ${m.days_since} days`).join("\n") || "No recent workouts recorded"}

Recent Workouts:
${recentWorkouts?.map((w: any) => `- ${w.date}: ${w.muscles.join(", ")}`).join("\n") || "No recent workouts"}

Please recommend today's workout with specific exercises, sets, reps, and any relevant tips.`;
    } else if (type === "diet_recommendation") {
      systemPrompt = `You are an expert nutritionist and diet coach. Based on the user's profile, fitness goals, and today's calorie intake, provide personalized diet and meal recommendations.

Key guidelines:
- Consider the user's calorie target and current intake
- Account for their diet preference (veg/non-veg/vegan)
- Suggest meals rich in protein for muscle recovery
- Include Indian food options when appropriate
- Provide macro breakdown for suggestions
- Keep recommendations practical and achievable`;

      userPrompt = `User Profile:
- Name: ${profile?.name || "User"}
- Weight: ${profile?.weight_kg || "Unknown"} kg
- Fitness Goal: ${profile?.fitness_goal || "general fitness"}
- Diet Preference: ${profile?.diet_preference || "non-veg"}
- Daily Calorie Target: ${profile?.daily_calorie_target || 2000} kcal

Today's Intake:
- Calories: ${todayCalories?.calories || 0} / ${profile?.daily_calorie_target || 2000} kcal
- Protein: ${todayCalories?.protein || 0}g
- Carbs: ${todayCalories?.carbs || 0}g
- Fats: ${todayCalories?.fats || 0}g

Please suggest meals for the rest of the day with calorie and macro information.`;
    } else {
      throw new Error("Invalid recommendation type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in ai-coach function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
