import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

export const Scene1Intro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const titleS = spring({ frame: frame - 15, fps, config: { damping: 18 } });
  const subS = spring({ frame: frame - 30, fps, config: { damping: 20 } });
  const tagS = spring({ frame: frame - 45, fps, config: { damping: 20 } });

  const logoY = interpolate(logoScale, [0, 1], [60, 0]);
  const pulse = Math.sin(frame * 0.08) * 4;

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", fontFamily }}>
      {/* Glow ring */}
      <div style={{
        position: "absolute",
        width: 280,
        height: 280,
        borderRadius: "50%",
        border: "2px solid hsla(217, 91%, 60%, 0.3)",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -70%) scale(${interpolate(logoScale, [0, 1], [0.3, 1 + pulse * 0.01])})`,
        opacity: interpolate(logoScale, [0, 1], [0, 0.6]),
        boxShadow: "0 0 60px hsla(217, 91%, 60%, 0.15)",
      }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        {/* Logo icon */}
        <div style={{
          width: 160,
          height: 160,
          borderRadius: 40,
          background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateY(${logoY}px) scale(${logoScale})`,
          boxShadow: "0 20px 60px hsla(217, 91%, 60%, 0.3)",
        }}>
          <span style={{ fontSize: 80 }}>🏋️</span>
        </div>

        {/* Title */}
        <div style={{
          fontSize: 88,
          fontWeight: 900,
          color: "white",
          transform: `translateY(${interpolate(titleS, [0, 1], [40, 0])}px)`,
          opacity: interpolate(titleS, [0, 1], [0, 1]),
          letterSpacing: -3,
        }}>
          FitAI Coach
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 34,
          fontWeight: 400,
          color: "hsla(0, 0%, 100%, 0.7)",
          transform: `translateY(${interpolate(subS, [0, 1], [30, 0])}px)`,
          opacity: interpolate(subS, [0, 1], [0, 1]),
          textAlign: "center",
          lineHeight: 1.4,
          maxWidth: 700,
        }}>
          The Complete Gym Management Platform
        </div>

        {/* Tag line */}
        <div style={{
          marginTop: 20,
          padding: "14px 36px",
          borderRadius: 40,
          background: "linear-gradient(135deg, hsla(217, 91%, 60%, 0.2), hsla(280, 70%, 50%, 0.2))",
          border: "1px solid hsla(217, 91%, 60%, 0.3)",
          fontSize: 22,
          color: "#93C5FD",
          fontWeight: 600,
          transform: `translateY(${interpolate(tagS, [0, 1], [20, 0])}px)`,
          opacity: interpolate(tagS, [0, 1], [0, 1]),
          letterSpacing: 3,
          textTransform: "uppercase" as const,
        }}>
          Built for the future
        </div>
      </div>
    </AbsoluteFill>
  );
};
