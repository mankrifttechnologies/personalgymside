import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface RestTimerProps {
  defaultSeconds?: number;
  onComplete?: () => void;
}

export default function RestTimer({ defaultSeconds = 90, onComplete }: RestTimerProps) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback((frequency: number = 800, duration: number = 200) => {
    if (isMuted) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [isMuted]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(s => {
          if (s <= 4 && s > 1) {
            playBeep(600, 100);
          }
          if (s === 1) {
            playBeep(1000, 500);
            onComplete?.();
          }
          return s - 1;
        });
      }, 1000);
    } else if (seconds === 0) {
      setIsRunning(false);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, seconds, playBeep, onComplete]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((defaultSeconds - seconds) / defaultSeconds) * 100;

  const presets = [30, 60, 90, 120, 180];

  return (
    <div className="glass rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Rest Timer</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMuted(!isMuted)}
          className="h-8 w-8"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
      </div>
      
      {/* Timer Display */}
      <div className="relative flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-secondary"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={352}
              strokeDashoffset={352 - (352 * progress) / 100}
              className="text-primary transition-all duration-1000"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold font-mono">{formatTime(seconds)}</span>
          </div>
        </div>
      </div>
      
      {/* Presets */}
      <div className="flex gap-2 justify-center flex-wrap">
        {presets.map(preset => (
          <Button
            key={preset}
            variant={seconds === preset && !isRunning ? 'default' : 'secondary'}
            size="sm"
            onClick={() => {
              setSeconds(preset);
              setIsRunning(false);
            }}
            className="text-xs"
          >
            {preset}s
          </Button>
        ))}
      </div>
      
      {/* Controls */}
      <div className="flex gap-2 justify-center">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => {
            setSeconds(defaultSeconds);
            setIsRunning(false);
          }}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="energy"
          size="lg"
          onClick={() => setIsRunning(!isRunning)}
          className="px-8"
        >
          {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
}
