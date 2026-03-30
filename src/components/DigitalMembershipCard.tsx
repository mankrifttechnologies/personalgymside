import { useGymMember } from '@/hooks/useAttendance';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dumbbell, QrCode, Shield } from 'lucide-react';

export default function DigitalMembershipCard() {
  const { data: gymMember } = useGymMember();
  const { profile } = useProfile();

  if (!gymMember || !profile) return null;

  const tierColors: Record<string, string> = {
    bronze: 'from-amber-700/80 to-amber-900/80',
    silver: 'from-slate-400/80 to-slate-600/80',
    gold: 'from-yellow-500/80 to-amber-600/80',
    platinum: 'from-cyan-400/80 to-blue-600/80',
    diamond: 'from-violet-400/80 to-purple-600/80',
  };

  const tier = profile.tier || 'bronze';
  const gradient = tierColors[tier] || tierColors.bronze;

  return (
    <Card className={`overflow-hidden relative bg-gradient-to-br ${gradient} border-0 text-white`}>
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

      <CardContent className="p-5 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wider">FIT AI GYM</span>
          </div>
          <Badge className="bg-white/20 text-white border-0 text-[10px] uppercase tracking-wider">
            {tier}
          </Badge>
        </div>

        {/* Member info */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-12 h-12 border-2 border-white/30">
            <AvatarImage src={profile.avatar_url || ''} />
            <AvatarFallback className="bg-white/20 text-white font-bold">
              {profile.name?.[0] || 'M'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-lg truncate">{profile.name || 'Member'}</p>
            <p className="text-xs text-white/70 font-mono tracking-widest">{gymMember.member_code}</p>
          </div>
        </div>

        {/* QR code area (simulated) */}
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-white/60 space-y-0.5">
            <p>Member Since: {new Date(gymMember.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Status: {gymMember.status}</span>
            </div>
          </div>
          <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center">
            <QrCode className="w-10 h-10 text-gray-900" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
