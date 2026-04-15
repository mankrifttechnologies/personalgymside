import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";

const AI_FEATURES = [
  { icon: "🧠", title: "AI Workout Builder", desc: "Personalized plans based on recovery & goals" },
  { icon: "📷", title: "Food Analyzer", desc: "Snap a photo → get instant nutrition data" },
  { icon: "💡", title: "Smart Suggestions", desc: "Muscle recovery-aware recommendations" },
  { icon: "🎯", title: "Exercise Library", desc: "AI-generated demos & instructions" },
];

export const Scene7AI = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headS = spring({ frame, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "100px 50px", fontFamily: "Inter, sans-serif" }}>
      <div style={{
        fontSize: 48,
        fontWeight: 900,
        background: "linear-gradient(135deg, #3B82F6, #A78BFA, #EC4899)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        opacity: interpolate(headS, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(headS, [0, 1], [30, 0])}px)`,
        marginBottom: 12,
        textAlign: "center",
      }}>
        AI-Powered Features
      </div>
      <div style={{
        fontSize: 24,
        color: "hsla(0,0%,100%,0.5)",
        opacity: interpolate(headS, [0, 1], [0, 1]),
        marginBottom: 50,
      }}>
        Intelligence built into every feature
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22, width: "100%", maxWidth: 820 }}>
        {AI_FEATURES.map((f, i) => {
          const s = spring({ frame: frame - 12 - i * 8, fps, config: { damping: 14 } });
          return (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              padding: "26px 30px",
              borderRadius: 22,
              background: "linear-gradient(135deg, hsla(217,91%,60%,0.08), hsla(280,70%,50%,0.05))",
              border: "1px solid hsla(217,91%,60%,0.12)",
              transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})`,
              opacity: interpolate(s, [0, 1], [0, 1]),
            }}>
              <span style={{ fontSize: 44 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "white" }}>{f.title}</div>
                <div style={{ fontSize: 18, color: "hsla(0,0%,100%,0.5)", marginTop: 4 }}>{f.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
