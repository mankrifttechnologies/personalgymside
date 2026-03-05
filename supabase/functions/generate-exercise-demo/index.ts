import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { exerciseName } = await req.json();
    if (!exerciseName) throw new Error("exerciseName is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Step 1: Generate text instructions
    const textResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "You are a fitness expert. Return ONLY a JSON array of 3-4 step objects for exercise form. Each object: {\"step\": number, \"title\": \"short title\", \"description\": \"1-2 sentence instruction\", \"imagePrompt\": \"detailed prompt for generating a fitness illustration showing this exact position, clean white background, simple instructional style, no text\"}. No markdown, just JSON.",
          },
          {
            role: "user",
            content: `Generate step-by-step form guide for: ${exerciseName}`,
          },
        ],
      }),
    });

    if (!textResp.ok) {
      const status = textResp.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI text error: ${status}`);
    }

    const textData = await textResp.json();
    const rawContent = textData.choices?.[0]?.message?.content || "[]";
    
    // Parse the JSON from the response
    let steps;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      steps = JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to parse exercise steps");
    }

    // Step 2: Generate images for each step
    const stepsWithImages = await Promise.all(
      steps.map(async (step: any) => {
        try {
          const imgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [
                {
                  role: "user",
                  content: `Create a clean, simple fitness instructional illustration: ${step.imagePrompt}. Show a fit person demonstrating the position. Minimalist style, white background, no text or labels.`,
                },
              ],
              modalities: ["image", "text"],
            }),
          });

          if (imgResp.ok) {
            const imgData = await imgResp.json();
            const imageUrl = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            return { ...step, imageUrl: imageUrl || null };
          }
          return { ...step, imageUrl: null };
        } catch {
          return { ...step, imageUrl: null };
        }
      })
    );

    return new Response(JSON.stringify({ steps: stepsWithImages }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-exercise-demo error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
