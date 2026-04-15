import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const PersistentBackground = () => {
  const frame = useCurrentFrame();
  const hueShift = interpolate(frame, [0, 750], [0, 30]);
  const y1 = interpolate(frame, [0, 750], [0, -80]);
  const y2 = interpolate(frame, [0, 750], [0, 60]);

  return (
    <AbsoluteFill>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `linear-gradient(160deg, hsl(${222 + hueShift}, 47%, 6%) 0%, hsl(${240 + hueShift}, 30%, 10%) 50%, hsl(${260 + hueShift}, 35%, 8%) 100%)`,
        }}
      />
      {/* Floating orbs */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, hsla(217, 91%, 60%, 0.12) 0%, transparent 70%)",
          top: 200 + y1,
          left: -100,
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, hsla(280, 70%, 50%, 0.1) 0%, transparent 70%)",
          bottom: 100 + y2,
          right: -80,
          filter: "blur(50px)",
        }}
      />
    </AbsoluteFill>
  );
};
