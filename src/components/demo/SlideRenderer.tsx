import { useEffect, useRef, useState, ReactNode } from "react";

interface SlideRendererProps {
  children: ReactNode;
}

const SLIDE_W = 1920;
const SLIDE_H = 1080;

export default function SlideRenderer({ children }: SlideRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const resize = () => {
      if (!containerRef.current) return;
      const { clientWidth: w, clientHeight: h } = containerRef.current;
      setScale(Math.min(w / SLIDE_W, h / SLIDE_H));
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-[hsl(222,47%,6%)]">
      <div
        className="absolute slide-content"
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          left: "50%",
          top: "50%",
          marginLeft: -SLIDE_W / 2,
          marginTop: -SLIDE_H / 2,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
