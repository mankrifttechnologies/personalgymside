import { useChallenges } from '@/hooks/useChallenges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Trophy, Droplets, Utensils, Dumbbell, CheckCircle2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const getChallengeIcon = (type: string) => {
  switch (type) {
    case 'workouts':
      return <Dumbbell className="h-5 w-5" />;
    case 'water':
      return <Droplets className="h-5 w-5" />;
    case 'calories':
      return <Utensils className="h-5 w-5" />;
    case 'exercises':
      return <Target className="h-5 w-5" />;
    default:
      return <Trophy className="h-5 w-5" />;
  }
};

const getChallengeColor = (type: string) => {
  switch (type) {
    case 'workouts':
      return 'bg-orange-500/20 text-orange-500';
    case 'water':
      return 'bg-blue-500/20 text-blue-500';
    case 'calories':
      return 'bg-green-500/20 text-green-500';
    case 'exercises':
      return 'bg-purple-500/20 text-purple-500';
    default:
      return 'bg-primary/20 text-primary';
  }
};

export const WeeklyChallenges = () => {
  const { challenges, userChallenges, isLoading, joinChallenge, getJoinedChallengeIds } = useChallenges();
  
  const joinedIds = getJoinedChallengeIds();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Weekly Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Weekly Challenges
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {challenges.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No active challenges right now
          </p>
        ) : (
          challenges.map((challenge) => {
            const isJoined = joinedIds.includes(challenge.id);
            const userChallenge = userChallenges.find(uc => uc.challenge_id === challenge.id);
            const progress = userChallenge?.current_progress || 0;
            const progressPercent = Math.min((progress / challenge.target_value) * 100, 100);
            const isCompleted = userChallenge?.completed_at !== null;
            const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());

            return (
              <div
                key={challenge.id}
                className={`p-4 rounded-lg border ${isCompleted ? 'bg-primary/5 border-primary/30' : 'bg-card'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`p-2 rounded-lg ${getChallengeColor(challenge.challenge_type)}`}>
                    {getChallengeIcon(challenge.challenge_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium">{challenge.title}</h4>
                      {isCompleted && (
                        <Badge variant="default" className="bg-primary text-primary-foreground">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    
                    {isJoined && (
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{progress} / {challenge.target_value}</span>
                          <span className="text-muted-foreground">{daysLeft}d left</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="outline" className="mb-2">
                      +{challenge.xp_reward} XP
                    </Badge>
                    {!isJoined && (
                      <Button
                        size="sm"
                        onClick={() => joinChallenge.mutate(challenge.id)}
                        disabled={joinChallenge.isPending}
                      >
                        Join
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
