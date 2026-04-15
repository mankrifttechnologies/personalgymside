import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";

const STATS = [
  { label: "Churn Prediction", value: "AI-Powered", color: "#EF4444" },
  { label: "Revenue Forecast", value: "Auto-Generated", color: "#10B981" },
  { label: "Member Segments", value: "Smart Groups", color: "#8B5CF6" },
  { label: "Custom Reports", value: "One-Click Export", color: "#F59E0B" },
];

export const Scene6Analytics = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headS = spring({ frame, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "100px 50px", fontFamily: "Inter, sans-serif" }}>
      <div style={{
        fontSize: 48,
        fontWeight: 900,
        color: "white",
        opacity: interpolate(headS, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(headS, [0, 1], [30, 0])}px)`,
        marginBottom: 12,
        textAlign: "center",
      }}>
        Advanced Analytics
      </div>
      <div style={{
        fontSize: 24,
        color: "#FDE68A",
        opacity: interpolate(headS, [0, 1], [0, 1]),
        marginBottom: 60,
      }}>
        Data-driven decisions
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28, width: "100%", maxWidth: 750 }}>
        {STATS.map((st, i) => {
          const s = spring({ frame: frame - 12 - i * 8, fps, config: { damping: 14 } });
          const barW = interpolate(s, [0, 1], [0, 100]);
          return (
            <div key={i} style={{
              opacity: interpolate(s, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 26, fontWeight: 700, color: "white" }}>{st.label}</span>
                <span style={{ fontSize: 22, fontWeight: 600, color: st.color }}>{st.value}</span>
              </div>
              <div style={{ width: "100%", height: 8, borderRadius: 4, background: "hsla(0,0%,100%,0.08)" }}>
                <div style={{
                  width: `${barW}%`,
                  height: "100%",
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${st.color}, ${st.color}88)`,
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating chart hint */}
      <div style={{
        marginTop: 60,
        display: "flex",
        gap: 8,
        alignItems: "flex-end",
        opacity: interpolate(spring({ frame: frame - 50, fps, config: { damping: 20 } }), [0, 1], [0, 0.6]),
      }}>
        {[40, 65, 50, 80, 70, 90, 85, 95].map((h, i) => (
          <div key={i} style={{
            width: 32,
            height: h * 2.5,
            borderRadius: 8,
            background: `linear-gradient(180deg, #3B82F6, #8B5CF666)`,
          }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
