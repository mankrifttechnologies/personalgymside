import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";

const ITEMS = [
  { icon: "📊", label: "Revenue Dashboard", desc: "Track income in real-time" },
  { icon: "👥", label: "Member Management", desc: "Add, remove, bulk upload" },
  { icon: "📅", label: "Class Scheduling", desc: "Manage all gym classes" },
  { icon: "💳", label: "Payment Recording", desc: "Log & track payments" },
  { icon: "📢", label: "Announcements", desc: "Push news to all members" },
  { icon: "📋", label: "Reports & Export", desc: "Generate detailed reports" },
];

export const Scene5OwnerDashboard = () => {
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
        Owner Dashboard
      </div>
      <div style={{
        fontSize: 24,
        color: "#6EE7B7",
        opacity: interpolate(headS, [0, 1], [0, 1]),
        marginBottom: 50,
      }}>
        Full control at your fingertips
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%", maxWidth: 820 }}>
        {ITEMS.map((item, i) => {
          const s = spring({ frame: frame - 10 - i * 7, fps, config: { damping: 15 } });
          return (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "22px 28px",
              borderRadius: 20,
              background: "linear-gradient(135deg, hsla(0,0%,100%,0.06), hsla(0,0%,100%,0.02))",
              border: "1px solid hsla(0,0%,100%,0.08)",
              transform: `translateX(${interpolate(s, [0, 1], [80, 0])}px)`,
              opacity: interpolate(s, [0, 1], [0, 1]),
            }}>
              <span style={{ fontSize: 38 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "white" }}>{item.label}</div>
                <div style={{ fontSize: 18, color: "hsla(0,0%,100%,0.5)", marginTop: 2 }}>{item.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
