import { useState, useEffect, useCallback } from "react";
import { slides } from "@/components/demo/slides";
import SlideRenderer from "@/components/demo/SlideRenderer";
import { ChevronLeft, ChevronRight, Maximize, Minimize, Presentation } from "lucide-react";

export default function Demo() {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const total = slides.length;

  const go = useCallback((dir: number) => {
    setCurrent(prev => Math.max(0, Math.min(total - 1, prev + dir)));
  }, [total]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      if (e.key === "Escape" && document.fullscreenElement) document.exitFullscreen();
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [go]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  };

  const CurrentSlide = slides[current];

  return (
    <div className="w-screen h-screen flex flex-col bg-[hsl(222,47%,4%)] select-none">
      {/* slide area */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 transition-opacity duration-300">
          <SlideRenderer>
            <CurrentSlide />
          </SlideRenderer>
        </div>

        {/* nav arrows */}
        {current > 0 && (
          <button onClick={() => go(-1)} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[hsl(222,30%,15%)]/80 hover:bg-[hsl(222,30%,20%)] flex items-center justify-center text-[hsl(0,0%,70%)] hover:text-[hsl(0,0%,95%)] transition-colors backdrop-blur-sm z-10">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {current < total - 1 && (
          <button onClick={() => go(1)} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[hsl(222,30%,15%)]/80 hover:bg-[hsl(222,30%,20%)] flex items-center justify-center text-[hsl(0,0%,70%)] hover:text-[hsl(0,0%,95%)] transition-colors backdrop-blur-sm z-10">
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* bottom bar */}
      <div className="h-14 flex items-center justify-between px-6 bg-[hsl(222,47%,6%)] border-t border-[hsl(222,30%,15%)] z-10">
        <div className="flex items-center gap-3 text-[hsl(0,0%,55%)]">
          <Presentation className="w-5 h-5" />
          <span className="text-sm font-medium">FitAI Coach — Demo</span>
        </div>

        {/* dots */}
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? "bg-primary scale-125" : "bg-[hsl(222,30%,25%)] hover:bg-[hsl(222,30%,35%)]"}`} />
          ))}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-[hsl(0,0%,45%)]">{current + 1} / {total}</span>
          <button onClick={toggleFullscreen} className="w-8 h-8 rounded-lg hover:bg-[hsl(222,30%,15%)] flex items-center justify-center text-[hsl(0,0%,55%)] hover:text-[hsl(0,0%,85%)] transition-colors">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* progress bar */}
      <div className="h-1 bg-[hsl(222,30%,10%)]">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((current + 1) / total) * 100}%` }} />
      </div>
    </div>
  );
}
