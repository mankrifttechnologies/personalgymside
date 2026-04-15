import { useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";

interface AnimatedTextProps {
  text: string;
  delay?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  align?: "center" | "left";
  maxWidth?: number;
}

export const AnimatedText = ({
  text,
  delay = 0,
  fontSize = 48,
  color = "white",
  fontWeight = 700,
  align = "center",
  maxWidth,
}: AnimatedTextProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 150 } });
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const y = interpolate(s, [0, 1], [30, 0]);

  return (
    <div
      style={{
        fontSize,
        fontWeight,
        color,
        textAlign: align,
        transform: `translateY(${y}px)`,
        opacity,
        lineHeight: 1.15,
        fontFamily: "Inter, sans-serif",
        maxWidth: maxWidth || "auto",
        letterSpacing: fontSize > 60 ? -2 : -0.5,
      }}
    >
      {text}
    </div>
  );
};
