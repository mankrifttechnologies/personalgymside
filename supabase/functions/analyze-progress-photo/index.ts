// Analyze a single progress photo OR compare two photos using Lovable AI (Gemini Vision)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json();
    const { mode, imageUrl, beforeUrl, afterUrl, beforeWeight, afterWeight } = body as {
      mode: "analyze" | "compare";
      imageUrl?: string;
      beforeUrl?: string;
      afterUrl?: string;
      beforeWeight?: number | null;
      afterWeight?: number | null;
    };

    let messages: any[];
    let tools: any[];
    let toolName: string;

    if (mode === "analyze") {
      if (!imageUrl) throw new Error("imageUrl required");
      toolName = "report_body_analysis";
      tools = [{
        type: "function",
        function: {
          name: toolName,
          description: "Report body composition estimates from a fitness progress photo.",
          parameters: {
            type: "object",
            properties: {
              estimated_body_fat_percentage: { type: "number", description: "Approx body fat % (5-50)." },
              muscle_mass_level: { type: "string", enum: ["low", "average", "above_average", "high", "very_high"] },
              muscular_development: { type: "string", description: "1-2 sentences on visible muscular development." },
              posture_notes: { type: "string", description: "Posture observations (1 sentence)." },
              visible_strengths: { type: "array", items: { type: "string" }, description: "2-3 strong areas." },
              areas_to_improve: { type: "array", items: { type: "string" }, description: "2-3 weaker areas." },
            },
            required: ["estimated_body_fat_percentage", "muscle_mass_level", "muscular_development", "posture_notes", "visible_strengths", "areas_to_improve"],
            additionalProperties: false,
          },
        },
      }];
      messages = [
        { role: "system", content: "You are a fitness coach analyzing a body progress photo. Provide rough estimates only (these are not medical). Be supportive and constructive." },
        { role: "user", content: [
          { type: "text", text: "Analyze this progress photo. Estimate body fat %, muscle mass, posture, strengths and weak areas." },
          { type: "image_url", image_url: { url: imageUrl } },
        ]},
      ];
    } else if (mode === "compare") {
      if (!beforeUrl || !afterUrl) throw new Error("beforeUrl and afterUrl required");
      toolName = "report_comparison";
      tools = [{
        type: "function",
        function: {
          name: toolName,
          description: "Report side-by-side body comparison findings.",
          parameters: {
            type: "object",
            properties: {
              overall_summary: { type: "string", description: "2-3 sentence motivating summary of changes." },
              body_fat_change: { type: "string", description: "e.g. 'Approx -2% body fat'" },
              muscle_change: { type: "string", description: "Visible muscle changes." },
              posture_change: { type: "string", description: "Posture differences." },
              improvements: { type: "array", items: { type: "string" }, description: "3-5 visible improvements." },
              focus_next: { type: "array", items: { type: "string" }, description: "2-3 areas to focus on next." },
            },
            required: ["overall_summary", "body_fat_change", "muscle_change", "posture_change", "improvements", "focus_next"],
            additionalProperties: false,
          },
        },
      }];
      const wt = (beforeWeight || afterWeight)
        ? `Before weight: ${beforeWeight ?? "?"} kg. After weight: ${afterWeight ?? "?"} kg.`
        : "";
      messages = [
        { role: "system", content: "You are a fitness coach comparing two body progress photos (before vs after). Be encouraging, specific, and constructive. Estimates only — not medical advice." },
        { role: "user", content: [
          { type: "text", text: `Compare these two progress photos. The first is BEFORE, the second is AFTER. ${wt} Identify visible changes in body composition, muscle, posture, and what to focus on next.` },
          { type: "image_url", image_url: { url: beforeUrl } },
          { type: "image_url", image_url: { url: afterUrl } },
        ]},
      ];
    } else {
      throw new Error("Invalid mode");
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools,
        tool_choice: { type: "function", function: { name: toolName } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      throw new Error(`AI error ${aiResp.status}: ${t}`);
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");
    const args = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ result: args }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-progress-photo error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
