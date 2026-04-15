import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { FeatureCard } from "../components/FeatureCard";

const FEATURES = [
  { icon: "🤖", title: "AI Workouts", color: "#3B82F6" },
  { icon: "🍎", title: "Nutrition\nTracking", color: "#10B981" },
  { icon: "🔥", title: "Workout\nStreaks", color: "#F59E0B" },
  { icon: "🏆", title: "Badges &\nLevels", color: "#8B5CF6" },
  { icon: "📈", title: "Progressive\nOverload", color: "#EC4899" },
  { icon: "💪", title: "Personal\nRecords", color: "#EF4444" },
  { icon: "💧", title: "Water &\nMacros", color: "#06B6D4" },
  { icon: "📱", title: "Digital ID\nCard", color: "#14B8A6" },
];

export const Scene3MemberFeatures = () => {
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
        Member Experience
      </div>
      <div style={{
        fontSize: 24,
        color: "#93C5FD",
        opacity: interpolate(headS, [0, 1], [0, 1]),
        marginBottom: 50,
      }}>
        Everything your members need
      </div>

      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 20,
        maxWidth: 900,
      }}>
        {FEATURES.map((f, i) => (
          <FeatureCard key={i} icon={f.icon} title={f.title} delay={10 + i * 6} color={f.color} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
