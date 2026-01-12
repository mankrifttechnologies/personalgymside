import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Gift,
  ArrowRight
} from 'lucide-react';
import { useGymMember, usePointsWallet, usePointsTransactions } from '@/hooks/useAttendance';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export function PointsWalletCard() {
  const { data: member } = useGymMember();
  const { data: wallet } = usePointsWallet(member?.id);
  const { data: transactions } = usePointsTransactions(wallet?.id);

  if (!member || !wallet) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Points Wallet
          </CardTitle>
          <Link to="/rewards">
            <Button variant="ghost" size="sm" className="gap-1">
              <Gift className="h-4 w-4" />
              Rewards
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="text-center p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/20">
          <p className="text-4xl font-bold text-primary">{wallet.balance}</p>
          <p className="text-sm text-muted-foreground">Available Points</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-semibold text-green-600 dark:text-green-400">
                {wallet.total_earned}
              </p>
              <p className="text-xs text-muted-foreground">Total Earned</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10">
            <TrendingDown className="h-5 w-5 text-orange-500" />
            <div>
              <p className="font-semibold text-orange-600 dark:text-orange-400">
                {wallet.total_spent}
              </p>
              <p className="text-xs text-muted-foreground">Total Spent</p>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        {transactions && transactions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Recent Activity</h4>
            <ScrollArea className="h-[120px]">
              <div className="space-y-2">
                {transactions.slice(0, 5).map(tx => (
                  <div 
                    key={tx.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      {tx.amount > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">{tx.description}</span>
                    </div>
                    <Badge variant={tx.amount > 0 ? 'default' : 'secondary'}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
