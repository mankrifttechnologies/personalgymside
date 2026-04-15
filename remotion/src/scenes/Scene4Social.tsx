import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { FeatureCard } from "../components/FeatureCard";

const FEATURES = [
  { icon: "📸", title: "Stories &\nPhotos", color: "#F472B6" },
  { icon: "👥", title: "Friends &\nFollows", color: "#3B82F6" },
  { icon: "🏅", title: "Leaderboards", color: "#F59E0B" },
  { icon: "⚔️", title: "Workout\nDuels", color: "#EF4444" },
  { icon: "🎯", title: "Group\nChallenges", color: "#8B5CF6" },
  { icon: "💬", title: "Real-time\nChat", color: "#10B981" },
];

export const Scene4Social = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headS = spring({ frame, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "100px 40px", fontFamily: "Inter, sans-serif" }}>
      <div style={{
        fontSize: 50,
        fontWeight: 900,
        color: "white",
        opacity: interpolate(headS, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(headS, [0, 1], [30, 0])}px)`,
        marginBottom: 12,
        textAlign: "center",
      }}>
        Social & Engagement
      </div>
      <div style={{
        fontSize: 24,
        color: "#C4B5FD",
        opacity: interpolate(headS, [0, 1], [0, 1]),
        marginBottom: 50,
      }}>
        Keep members coming back
      </div>

      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 24,
        maxWidth: 800,
      }}>
        {FEATURES.map((f, i) => (
          <FeatureCard key={i} icon={f.icon} title={f.title} delay={10 + i * 7} color={f.color} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
