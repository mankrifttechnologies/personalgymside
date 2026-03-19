import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGymMember, usePointsWallet, usePointsTransactions } from '@/hooks/useAttendance';
import { useRewardsCatalog, useRedeemReward, useMyRedemptions } from '@/hooks/useRewards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import BottomNav from '@/components/BottomNav';
import { 
  ChevronLeft, 
  Gift, 
  Coins, 
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  Loader2,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format } from 'date-fns';

export default function Rewards() {
  const { user, loading: authLoading } = useAuth();
  const { data: gymMember, isLoading: memberLoading } = useGymMember();
  const { data: wallet } = usePointsWallet(gymMember?.id);
  const { data: transactions } = usePointsTransactions(wallet?.id);
  const { data: catalog, isLoading: catalogLoading } = useRewardsCatalog();
  const { data: myRedemptions } = useMyRedemptions(gymMember?.id);
  const redeemReward = useRedeemReward();
  const [activeTab, setActiveTab] = useState('catalog');
  const [selectedReward, setSelectedReward] = useState<any>(null);

  if (authLoading || memberLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!gymMember) {
    return (
      <div className="min-h-screen pb-24">
        <header className="p-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Rewards</h1>
        </header>

        <main className="px-4">
          <Card className="text-center py-8">
            <CardHeader>
              <div className="mx-auto p-4 rounded-full bg-primary/20 w-fit mb-4">
                <Gift className="w-12 h-12 text-primary" />
              </div>
              <CardTitle>Activate Membership First</CardTitle>
              <CardDescription>
                You need an active gym membership to access rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/attendance">
                <Button variant="energy">
                  Go to Attendance
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <BottomNav />
      </div>
    );
  }

  const handleRedeem = async () => {
    if (!selectedReward || !gymMember) return;
    
    await redeemReward.mutateAsync({
      memberId: gymMember.id,
      rewardId: selectedReward.id,
      pointsCost: selectedReward.points_cost
    });
    
    setSelectedReward(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</Badge>;
      case 'fulfilled':
        return <Badge className="gap-1 bg-green-500"><Package className="w-3 h-3" /> Fulfilled</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'training':
        return '🏋️';
      case 'nutrition':
        return '🥗';
      case 'merchandise':
        return '👕';
      case 'wellness':
        return '💆';
      default:
        return '🎁';
    }
  };

  return (
    <div className="min-h-screen pb-24 safe-area-top">
      {/* Header */}
      <header className="p-4 flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Rewards
          </h1>
          <p className="text-sm text-muted-foreground">Redeem your points</p>
        </div>
      </header>

      <main className="px-4 space-y-4">
        {/* Points Balance Card */}
        <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Available Points</p>
                <div className="flex items-center gap-2">
                  <Coins className="w-8 h-8 text-yellow-500" />
                  <span className="text-4xl font-bold">{wallet?.balance || 0}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-lg font-semibold text-accent flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {wallet?.total_earned || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="catalog" className="gap-1 text-xs sm:text-sm px-1 sm:px-3">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Catalog</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1 text-xs sm:text-sm px-1 sm:px-3">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Rewards</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-1 text-xs sm:text-sm px-1 sm:px-3">
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Points</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="mt-4">
            {catalogLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : catalog && catalog.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {catalog.map(reward => {
                  const canAfford = (wallet?.balance || 0) >= reward.points_cost;
                  const outOfStock = reward.stock !== null && reward.stock <= 0;
                  
                  return (
                    <Dialog key={reward.id}>
                      <DialogTrigger asChild>
                        <Card 
                          className={`cursor-pointer transition-all hover:scale-[1.02] ${
                            !canAfford || outOfStock ? 'opacity-60' : ''
                          }`}
                          onClick={() => setSelectedReward(reward)}
                        >
                          <CardHeader className="p-3 pb-2">
                            <div className="text-3xl mb-2">{getCategoryIcon(reward.category)}</div>
                            <CardTitle className="text-sm line-clamp-2">{reward.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            <div className="flex items-center gap-1 text-yellow-500 font-bold">
                              <Coins className="w-4 h-4" />
                              {reward.points_cost}
                            </div>
                            {outOfStock && (
                              <Badge variant="destructive" className="mt-2 text-xs">Out of Stock</Badge>
                            )}
                          </CardContent>
                        </Card>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <div className="text-4xl mb-2">{getCategoryIcon(reward.category)}</div>
                          <DialogTitle>{reward.name}</DialogTitle>
                          <DialogDescription>{reward.description}</DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Cost</span>
                            <div className="flex items-center gap-1 text-yellow-500 font-bold text-lg">
                              <Coins className="w-5 h-5" />
                              {reward.points_cost} points
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Your Balance</span>
                            <span className={`font-bold ${canAfford ? 'text-accent' : 'text-destructive'}`}>
                              {wallet?.balance || 0} points
                            </span>
                          </div>
                          
                          {reward.stock !== null && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">In Stock</span>
                              <span className={`font-bold ${outOfStock ? 'text-destructive' : ''}`}>
                                {reward.stock}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            variant="energy" 
                            className="w-full gap-2"
                            disabled={!canAfford || outOfStock || redeemReward.isPending}
                            onClick={handleRedeem}
                          >
                            {redeemReward.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            {!canAfford ? 'Not Enough Points' : outOfStock ? 'Out of Stock' : 'Redeem Now'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  );
                })}
              </div>
            ) : (
              <Card className="py-12 text-center">
                <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No rewards available</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {myRedemptions && myRedemptions.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {myRedemptions.map(redemption => (
                    <Card key={redemption.id}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{redemption.rewards_catalog?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(redemption.redeemed_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(redemption.status)}
                            <p className="text-sm text-yellow-500 mt-1">
                              -{redemption.points_spent} pts
                            </p>
                          </div>
                        </div>
                        {redemption.admin_notes && (
                          <p className="text-sm text-muted-foreground mt-2 bg-secondary/50 p-2 rounded">
                            Note: {redemption.admin_notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <Card className="py-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No redemptions yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Redeem points for awesome rewards!
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="mt-4">
            {transactions && transactions.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {transactions.map(tx => {
                    const isPositive = tx.amount > 0;
                    
                    return (
                      <Card key={tx.id}>
                        <CardContent className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${
                                isPositive ? 'bg-green-500/20' : 'bg-red-500/20'
                              }`}>
                                {isPositive ? (
                                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                                ) : (
                                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-sm capitalize">
                                  {tx.transaction_type.replace('_', ' ')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(tx.created_at), 'MMM d, h:mm a')}
                                </p>
                              </div>
                            </div>
                            <span className={`font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                              {isPositive ? '+' : ''}{tx.amount}
                            </span>
                          </div>
                          {tx.description && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {tx.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <Card className="py-12 text-center">
                <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No transactions yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Earn points by attending the gym!
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
