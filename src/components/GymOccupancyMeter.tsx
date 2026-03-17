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
    <div className="glass-card p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-sm">Live Gym Occupancy</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary">
          <Wifi className={`w-3 h-3 ${config.color} animate-pulse`} />
          <span className={`text-[11px] font-semibold ${config.color}`}>{config.label}</span>
        </div>
      </div>

      {/* Capacity Bar */}
      <div className="relative h-3 bg-secondary rounded-full overflow-hidden mb-3">
        <div
          className={`h-full ${config.bg} transition-all duration-1000 ease-out rounded-full`}
          style={{ width: `${occupancyPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {isLoading ? '...' : <><span className="text-foreground font-extrabold text-xl">{checkedInCount}</span> <span className="text-xs">/ {capacity}</span></>}
        </span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.bg}/20 ${config.color}`}>
          {Math.round(occupancyPercent)}% full
        </span>
      </div>
    </div>
  );
}
