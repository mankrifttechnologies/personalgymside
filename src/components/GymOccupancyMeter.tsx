import { useGymOccupancy } from '@/hooks/useGymOccupancy';
import { Users, Wifi } from 'lucide-react';

export default function GymOccupancyMeter() {
  const { checkedInCount, capacity, occupancyPercent, status, isLoading } = useGymOccupancy();

  const statusConfig = {
    low: { label: 'Not Busy', color: 'text-accent', bg: 'bg-accent', ring: 'ring-accent/30' },
    moderate: { label: 'Moderate', color: 'text-warning', bg: 'bg-warning', ring: 'ring-warning/30' },
    high: { label: 'Very Busy', color: 'text-destructive', bg: 'bg-destructive', ring: 'ring-destructive/30' },
  };

  const config = statusConfig[status];

  return (
    <div className="glass rounded-xl p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <span className="font-semibold">Live Gym Occupancy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wifi className={`w-3.5 h-3.5 ${config.color} animate-pulse`} />
          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        </div>
      </div>

      {/* Capacity Bar */}
      <div className="relative h-4 bg-secondary rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${config.bg} transition-all duration-1000 ease-out rounded-full`}
          style={{ width: `${occupancyPercent}%` }}
        />
        {/* Markers */}
        <div className="absolute inset-0 flex justify-between px-0.5 items-center pointer-events-none">
          {[25, 50, 75].map((mark) => (
            <div
              key={mark}
              className="w-px h-2 bg-foreground/20"
              style={{ marginLeft: `${mark}%`, position: 'absolute', left: 0 }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {isLoading ? '...' : <><span className="text-foreground font-bold text-lg">{checkedInCount}</span> / {capacity} members</>}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bg}/20 ${config.color}`}>
          {Math.round(occupancyPercent)}% full
        </span>
      </div>
    </div>
  );
}
