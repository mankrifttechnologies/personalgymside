import { useState } from 'react';
import { useWorkoutDuels } from '@/hooks/useWorkoutDuels';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import BottomNav from '@/components/BottomNav';
import { ArrowLeft, Swords, Trophy, Clock, Check, X, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function Duels() {
  const { user } = useAuth();
  const { activeDuels, pendingDuels, completedDuels, createDuel, respondDuel, updateScore, isLoading } = useWorkoutDuels();
  const { acceptedFriends } = useFriends();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [duelType, setDuelType] = useState('volume');
  const [targetValue, setTargetValue] = useState('1000');

  const handleCreate = () => {
    if (!selectedFriend) return;
    createDuel.mutate({
      opponentId: selectedFriend,
      duelType,
      targetValue: parseInt(targetValue) || 1000,
    });
    setShowCreate(false);
  };

  const getDuelTypeLabel = (type: string) => {
    switch (type) {
      case 'volume': return 'Total Volume (kg)';
      case 'exercises': return 'Exercises Completed';
      case 'duration': return 'Workout Duration (min)';
      default: return type;
    }
  };

  const getProgress = (score: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((score / target) * 100, 100);
  };

  return (
    <div className="min-h-screen pb-24 safe-area-top">
      <header className="p-3 sm:p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link to="/">
            <Button variant="ghost" size="icon" className="w-9 h-9 shrink-0"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Swords className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" /> <span className="truncate">Workout Duels</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Challenge friends</p>
          </div>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button variant="energy" size="sm" className="shrink-0 text-xs sm:text-sm">⚔️ Challenge</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a Duel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Opponent</Label>
                <Select value={selectedFriend} onValueChange={setSelectedFriend}>
                  <SelectTrigger><SelectValue placeholder="Choose a friend" /></SelectTrigger>
                  <SelectContent>
                    {(acceptedFriends || []).map((f: any) => (
                      <SelectItem key={f.friendUserId} value={f.friendUserId}>
                        {f.profile?.name || 'Friend'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Challenge Type</Label>
                <Select value={duelType} onValueChange={setDuelType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="volume">Total Volume (kg)</SelectItem>
                    <SelectItem value="exercises">Exercises Completed</SelectItem>
                    <SelectItem value="duration">Workout Duration (min)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target</Label>
                <Input type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)} />
              </div>
              <Button variant="energy" className="w-full" onClick={handleCreate} disabled={!selectedFriend}>
                Send Challenge ⚔️
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <main className="px-4">
        <Tabs defaultValue="active">
          <TabsList className="w-full">
            <TabsTrigger value="active" className="flex-1 text-xs sm:text-sm">Active ({activeDuels.length})</TabsTrigger>
            <TabsTrigger value="pending" className="flex-1 text-xs sm:text-sm">Pending ({pendingDuels.length})</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 text-xs sm:text-sm">History</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3 mt-4">
            {activeDuels.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No active duels</div>
            ) : activeDuels.map((duel: any) => {
              const isChallenger = duel.challenger_id === user?.id;
              const myScore = isChallenger ? Number(duel.challenger_score) : Number(duel.opponent_score);
              const theirScore = isChallenger ? Number(duel.opponent_score) : Number(duel.challenger_score);
              const target = duel.target_value;
              
              return (
                <Card key={duel.id} className="glass border-primary/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="text-primary border-primary">
                        <Zap className="w-3 h-3 mr-1" /> {getDuelTypeLabel(duel.duel_type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(duel.end_time), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-accent">You</span>
                          <span>{myScore} / {target}</span>
                        </div>
                        <Progress value={getProgress(myScore, target)} className="h-3" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-destructive">Opponent</span>
                          <span>{theirScore} / {target}</span>
                        </div>
                        <Progress value={getProgress(theirScore, target)} className="h-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="pending" className="space-y-3 mt-4">
            {pendingDuels.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No pending duels</div>
            ) : pendingDuels.map((duel: any) => {
              const isReceived = duel.opponent_id === user?.id;
              return (
                <Card key={duel.id} className="glass border-warning/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{getDuelTypeLabel(duel.duel_type)}</p>
                        <p className="text-sm text-muted-foreground">Target: {duel.target_value}</p>
                        <p className="text-xs text-muted-foreground">
                          {isReceived ? 'You were challenged!' : 'Waiting for response...'}
                        </p>
                      </div>
                      {isReceived && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="energy" onClick={() => respondDuel.mutate({ duelId: duel.id, accept: true })}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => respondDuel.mutate({ duelId: duel.id, accept: false })}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3 mt-4">
            {completedDuels.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No completed duels yet</div>
            ) : completedDuels.map((duel: any) => {
              const won = duel.winner_id === user?.id;
              return (
                <Card key={duel.id} className={`glass ${won ? 'border-accent/30' : 'border-destructive/30'}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{getDuelTypeLabel(duel.duel_type)}</p>
                      <p className="text-sm text-muted-foreground">
                        {Number(duel.challenger_score)} vs {Number(duel.opponent_score)}
                      </p>
                    </div>
                    <Badge className={won ? 'bg-accent text-accent-foreground' : 'bg-destructive text-destructive-foreground'}>
                      <Trophy className="w-3 h-3 mr-1" />
                      {won ? 'Won' : 'Lost'}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
