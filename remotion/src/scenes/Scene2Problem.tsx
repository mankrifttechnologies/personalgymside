import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";

const PROBLEMS = [
  { icon: "📋", text: "10+ separate tools" },
  { icon: "💸", text: "Revenue tracking chaos" },
  { icon: "📊", text: "No unified analytics" },
  { icon: "😤", text: "Members churn silently" },
  { icon: "📱", text: "No mobile experience" },
];

export const Scene2Problem = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headS = spring({ frame, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "120px 60px", fontFamily: "Inter, sans-serif" }}>
      <div style={{
        fontSize: 56,
        fontWeight: 900,
        color: "white",
        textAlign: "center",
        opacity: interpolate(headS, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(headS, [0, 1], [30, 0])}px)`,
        marginBottom: 16,
      }}>
        The Problem
      </div>
      <div style={{
        fontSize: 26,
        color: "hsla(0,0%,100%,0.5)",
        opacity: interpolate(headS, [0, 1], [0, 1]),
        marginBottom: 60,
        textAlign: "center",
      }}>
        Gyms juggle too many disconnected tools
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%", maxWidth: 800 }}>
        {PROBLEMS.map((p, i) => {
          const s = spring({ frame: frame - 12 - i * 8, fps, config: { damping: 15 } });
          return (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "24px 32px",
              borderRadius: 20,
              background: "linear-gradient(135deg, hsla(0,80%,50%,0.08), hsla(0,80%,50%,0.03))",
              border: "1px solid hsla(0,80%,50%,0.15)",
              transform: `translateX(${interpolate(s, [0, 1], [-60, 0])}px)`,
              opacity: interpolate(s, [0, 1], [0, 1]),
            }}>
              <span style={{ fontSize: 40 }}>{p.icon}</span>
              <span style={{ fontSize: 28, color: "hsla(0,0%,100%,0.85)", fontWeight: 600 }}>{p.text}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
