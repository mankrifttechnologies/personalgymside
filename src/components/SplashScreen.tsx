import { useState, useEffect } from 'react';
import { Dumbbell } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 800);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1200);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Logo and branding */}
      <div className="relative flex flex-col items-center animate-scale-in">
        <div className="p-5 rounded-2xl bg-primary/20 mb-6 animate-pulse">
          <Dumbbell className="w-16 h-16 text-primary" />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-gradient mb-3">
          FitAI Coach
        </h1>
        
        <p className="text-muted-foreground text-sm mb-8">
          developed by Ankit Shahi
        </p>

        {/* Loading indicator */}
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
