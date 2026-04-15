import { useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";

interface FeatureCardProps {
  icon: string;
  title: string;
  delay: number;
  color?: string;
  small?: boolean;
}

export const FeatureCard = ({ icon, title, delay, color = "#3B82F6", small }: FeatureCardProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 120 } });
  const scale = interpolate(s, [0, 1], [0.5, 1]);
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const y = interpolate(s, [0, 1], [40, 0]);

  const w = small ? 200 : 240;
  const h = small ? 180 : 200;
  const iconSize = small ? 44 : 56;
  const fontSize = small ? 18 : 22;

  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 24,
        background: `linear-gradient(145deg, hsla(0,0%,100%,0.08), hsla(0,0%,100%,0.03))`,
        border: `1px solid hsla(0,0%,100%,0.1)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        transform: `translateY(${y}px) scale(${scale})`,
        opacity,
        boxShadow: `0 8px 32px hsla(0,0%,0%,0.3), inset 0 1px 0 hsla(0,0%,100%,0.05)`,
      }}
    >
      <div
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${color}33, ${color}11)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: iconSize * 0.55,
        }}
      >
        {icon}
      </div>
      <span
        style={{
          color: "white",
          fontSize,
          fontWeight: 600,
          textAlign: "center",
          lineHeight: 1.2,
          padding: "0 12px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {title}
      </span>
    </div>
  );
};
