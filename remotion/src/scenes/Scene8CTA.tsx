import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";

const HIGHLIGHTS = ["All-in-One Platform", "AI-Powered", "Mobile Native", "Role-Based Access", "Real-time Analytics"];

export const Scene8CTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headS = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const subS = spring({ frame: frame - 20, fps, config: { damping: 18 } });

  const pulse = Math.sin(frame * 0.06) * 6;

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      {/* Radial glow */}
      <div style={{
        position: "absolute",
        width: 800,
        height: 800,
        borderRadius: "50%",
        background: "radial-gradient(circle, hsla(217,91%,60%,0.15) 0%, transparent 60%)",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${1 + pulse * 0.005})`,
      }} />

      <div style={{
        fontSize: 60,
        fontWeight: 900,
        color: "white",
        textAlign: "center",
        opacity: interpolate(headS, [0, 1], [0, 1]),
        transform: `scale(${interpolate(headS, [0, 1], [0.8, 1])})`,
        lineHeight: 1.2,
        maxWidth: 800,
        marginBottom: 30,
      }}>
        Ready to Transform{"\n"}Your Gym?
      </div>

      <div style={{
        fontSize: 26,
        color: "hsla(0,0%,100%,0.5)",
        opacity: interpolate(subS, [0, 1], [0, 1]),
        marginBottom: 50,
        textAlign: "center",
      }}>
        One platform. Unlimited potential.
      </div>

      {/* Highlight pills */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 14,
        maxWidth: 750,
        marginBottom: 50,
      }}>
        {HIGHLIGHTS.map((h, i) => {
          const s = spring({ frame: frame - 30 - i * 6, fps, config: { damping: 14 } });
          return (
            <div key={i} style={{
              padding: "12px 28px",
              borderRadius: 30,
              background: "linear-gradient(135deg, hsla(217,91%,60%,0.15), hsla(280,70%,50%,0.1))",
              border: "1px solid hsla(217,91%,60%,0.2)",
              fontSize: 20,
              color: "#93C5FD",
              fontWeight: 600,
              opacity: interpolate(s, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(s, [0, 1], [15, 0])}px)`,
            }}>
              {h}
            </div>
          );
        })}
      </div>

      {/* CTA button */}
      {(() => {
        const btnS = spring({ frame: frame - 60, fps, config: { damping: 12 } });
        return (
          <div style={{
            padding: "22px 60px",
            borderRadius: 20,
            background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
            fontSize: 30,
            fontWeight: 800,
            color: "white",
            opacity: interpolate(btnS, [0, 1], [0, 1]),
            transform: `scale(${interpolate(btnS, [0, 1], [0.8, 1])}) translateY(${pulse}px)`,
            boxShadow: "0 16px 48px hsla(217, 91%, 60%, 0.3)",
            letterSpacing: 1,
          }}>
            Get Started Today
          </div>
        );
      })()}

      {/* Developer credit */}
      <div style={{
        position: "absolute",
        bottom: 80,
        fontSize: 18,
        color: "hsla(0,0%,100%,0.3)",
        opacity: interpolate(spring({ frame: frame - 70, fps, config: { damping: 20 } }), [0, 1], [0, 1]),
      }}>
        developed by Ankit Shahi
      </div>
    </AbsoluteFill>
  );
};
