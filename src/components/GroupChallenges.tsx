import { useGroupChallenges, GroupChallenge } from '@/hooks/useGroupChallenges';
import { Button } from '@/components/ui/button';
import { Swords, Users, Trophy, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

function ChallengeCard({ challenge }: { challenge: GroupChallenge }) {
  const { joinTeam, getUserTeam } = useGroupChallenges();
  const userTeam = getUserTeam(challenge);
  const teams = challenge.teams || [];

  // Find max score for progress bar
  const maxScore = Math.max(...teams.map(t => t.total_score), 1);

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">{challenge.title}</h4>
          <p className="text-xs text-muted-foreground">{challenge.description}</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-accent font-medium">+{challenge.xp_reward} XP</span>
          <p className="text-[10px] text-muted-foreground">
            Ends {format(new Date(challenge.end_date), 'MMM d')}
          </p>
        </div>
      </div>

      {/* Team Bars */}
      <div className="space-y-2">
        {teams.map((team) => {
          const progress = challenge.target_value > 0
            ? Math.min((team.total_score / challenge.target_value) * 100, 100)
            : (team.total_score / maxScore) * 100;
          const isUserTeam = userTeam?.id === team.id;

          return (
            <div key={team.id} className={`rounded-lg p-2.5 ${isUserTeam ? 'ring-1 ring-primary' : 'bg-secondary/30'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                  <span className="text-sm font-medium">{team.name}</span>
                  {isUserTeam && (
                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded-full">Your Team</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{team.members?.length || 0}</span>
                  <span className="text-sm font-bold ml-2">{Math.round(team.total_score)}</span>
                </div>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: team.color,
                  }}
                />
              </div>
              {!userTeam && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-1.5 text-xs h-7"
                  onClick={() => joinTeam.mutate(team.id)}
                  disabled={joinTeam.isPending}
                >
                  {joinTeam.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Join Team'}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GroupChallengesSection() {
  const { challenges, isLoading } = useGroupChallenges();

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-4 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!challenges.length) {
    return (
      <div className="glass rounded-xl p-4 animate-slide-up">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Swords className="w-5 h-5 text-primary" />
          Team Challenges
        </h3>
        <p className="text-sm text-muted-foreground text-center py-4">
          No active team challenges right now. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <h3 className="font-semibold flex items-center gap-2">
        <Swords className="w-5 h-5 text-primary" />
        Team Challenges
        <Trophy className="w-4 h-4 text-warning" />
      </h3>
      {challenges.map((challenge) => (
        <ChallengeCard key={challenge.id} challenge={challenge} />
      ))}
    </div>
  );
}
