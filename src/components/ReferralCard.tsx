import { useProfile } from '@/hooks/useProfile';
import { useReferrals } from '@/hooks/useReferrals';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Copy, Users, Trophy } from 'lucide-react';
import { toast } from 'sonner';

export default function ReferralCard() {
  const { profile } = useProfile();
  const { myReferrals, totalPoints, isLoading } = useReferrals();

  const friendCode = profile?.friend_code;

  const copyCode = () => {
    if (friendCode) {
      navigator.clipboard.writeText(friendCode);
      toast.success('Friend code copied!');
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Gift className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-sm">Refer & Earn</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Share your friend code and earn 100 points per referral!
        </p>
      </div>
      <CardContent className="p-4 space-y-4">
        {friendCode && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-secondary rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Your Code</p>
              <p className="text-lg font-bold tracking-widest">{friendCode}</p>
            </div>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl shrink-0" onClick={copyCode}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <Users className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold">{myReferrals.length}</p>
            <p className="text-[10px] text-muted-foreground">Referrals</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <Trophy className="w-4 h-4 mx-auto mb-1 text-accent" />
            <p className="text-xl font-bold">{totalPoints}</p>
            <p className="text-[10px] text-muted-foreground">Points Earned</p>
          </div>
        </div>

        {myReferrals.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Recent Referrals</p>
            {myReferrals.slice(0, 3).map(r => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
                <Badge variant={r.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                  {r.status === 'completed' ? `+${r.reward_points} pts` : r.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
