import { useMuscleRecovery } from '@/hooks/useWorkouts';
import { MuscleGroup } from '@/types/fitness';

const MUSCLE_COLORS: Record<string, { recovering: string; recovered: string; fresh: string }> = {
  chest:     { recovering: '#ef4444', recovered: '#22c55e', fresh: '#6b7280' },
  back:      { recovering: '#ef4444', recovered: '#22c55e', fresh: '#6b7280' },
  shoulders: { recovering: '#ef4444', recovered: '#22c55e', fresh: '#6b7280' },
  biceps:    { recovering: '#ef4444', recovered: '#22c55e', fresh: '#6b7280' },
  triceps:   { recovering: '#ef4444', recovered: '#22c55e', fresh: '#6b7280' },
  legs:      { recovering: '#ef4444', recovered: '#22c55e', fresh: '#6b7280' },
  abs:       { recovering: '#ef4444', recovered: '#22c55e', fresh: '#6b7280' },
};

export default function MuscleHeatmap() {
  const { getRecoveryStatus } = useMuscleRecovery();

  const getColor = (muscle: MuscleGroup) => {
    const status = getRecoveryStatus(muscle);
    return MUSCLE_COLORS[muscle][status.status];
  };

  const getOpacity = (muscle: MuscleGroup) => {
    const status = getRecoveryStatus(muscle);
    if (status.status === 'recovering') return 0.9;
    if (status.status === 'recovered') return 0.7;
    return 0.3;
  };

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        🔥 Muscle Heatmap
      </h3>
      <div className="flex justify-center">
        <svg viewBox="0 0 200 380" className="w-48 h-auto">
          {/* Head */}
          <circle cx="100" cy="30" r="20" fill="hsl(var(--muted))" opacity="0.5" />
          
          {/* Neck */}
          <rect x="92" y="50" width="16" height="15" rx="4" fill="hsl(var(--muted))" opacity="0.4" />

          {/* Shoulders - Left */}
          <ellipse cx="60" cy="75" rx="22" ry="12" fill={getColor('shoulders')} opacity={getOpacity('shoulders')} />
          {/* Shoulders - Right */}
          <ellipse cx="140" cy="75" rx="22" ry="12" fill={getColor('shoulders')} opacity={getOpacity('shoulders')} />

          {/* Chest */}
          <ellipse cx="80" cy="100" rx="25" ry="22" fill={getColor('chest')} opacity={getOpacity('chest')} />
          <ellipse cx="120" cy="100" rx="25" ry="22" fill={getColor('chest')} opacity={getOpacity('chest')} />

          {/* Back (behind chest, slightly visible) */}
          <rect x="70" y="85" width="60" height="50" rx="10" fill={getColor('back')} opacity={getOpacity('back') * 0.4} />

          {/* Abs */}
          <rect x="82" y="125" width="36" height="45" rx="8" fill={getColor('abs')} opacity={getOpacity('abs')} />

          {/* Biceps - Left */}
          <ellipse cx="42" cy="110" rx="10" ry="25" fill={getColor('biceps')} opacity={getOpacity('biceps')} />
          {/* Biceps - Right */}
          <ellipse cx="158" cy="110" rx="10" ry="25" fill={getColor('biceps')} opacity={getOpacity('biceps')} />

          {/* Triceps - Left */}
          <ellipse cx="38" cy="115" rx="7" ry="20" fill={getColor('triceps')} opacity={getOpacity('triceps')} />
          {/* Triceps - Right */}
          <ellipse cx="162" cy="115" rx="7" ry="20" fill={getColor('triceps')} opacity={getOpacity('triceps')} />

          {/* Forearms */}
          <rect x="30" y="140" width="12" height="35" rx="5" fill="hsl(var(--muted))" opacity="0.4" />
          <rect x="158" y="140" width="12" height="35" rx="5" fill="hsl(var(--muted))" opacity="0.4" />

          {/* Legs - Left */}
          <ellipse cx="85" cy="215" rx="18" ry="40" fill={getColor('legs')} opacity={getOpacity('legs')} />
          {/* Legs - Right */}
          <ellipse cx="115" cy="215" rx="18" ry="40" fill={getColor('legs')} opacity={getOpacity('legs')} />

          {/* Calves - Left */}
          <ellipse cx="82" cy="290" rx="12" ry="35" fill={getColor('legs')} opacity={getOpacity('legs') * 0.7} />
          {/* Calves - Right */}
          <ellipse cx="118" cy="290" rx="12" ry="35" fill={getColor('legs')} opacity={getOpacity('legs') * 0.7} />

          {/* Feet */}
          <ellipse cx="80" cy="335" rx="14" ry="8" fill="hsl(var(--muted))" opacity="0.4" />
          <ellipse cx="120" cy="335" rx="14" ry="8" fill="hsl(var(--muted))" opacity="0.4" />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Recovering</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Recovered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gray-500" />
          <span className="text-muted-foreground">Not Trained</span>
        </div>
      </div>
    </div>
  );
}
