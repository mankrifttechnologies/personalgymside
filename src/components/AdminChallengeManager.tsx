import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGroupChallenges } from '@/hooks/useGroupChallenges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Swords, Plus, Trash2, Loader2, Users, Trophy, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TeamInput {
  name: string;
  color: string;
}

const TEAM_COLORS = ['#6366f1', '#ef4444', '#22c55e', '#f59e0b', '#06b6d4', '#ec4899'];

export default function AdminChallengeManager() {
  const { user } = useAuth();
  const { challenges, isLoading } = useGroupChallenges();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [challengeType, setChallengeType] = useState('volume');
  const [targetValue, setTargetValue] = useState(1000);
  const [xpReward, setXpReward] = useState(200);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [teams, setTeams] = useState<TeamInput[]>([
    { name: 'Team Alpha', color: TEAM_COLORS[0] },
    { name: 'Team Beta', color: TEAM_COLORS[1] },
  ]);

  const createChallenge = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!title || !endDate || teams.length < 2) {
        throw new Error('Fill in all required fields with at least 2 teams');
      }

      // Create challenge
      const { data: challenge, error: challengeError } = await supabase
        .from('group_challenges')
        .insert({
          title,
          description: description || null,
          challenge_type: challengeType,
          target_value: targetValue,
          xp_reward: xpReward,
          start_date: startDate,
          end_date: endDate,
          created_by: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (challengeError) throw challengeError;

      // Create teams
      const teamRows = teams.map(t => ({
        challenge_id: challenge.id,
        name: t.name,
        color: t.color,
      }));

      const { error: teamsError } = await supabase
        .from('challenge_teams')
        .insert(teamRows);

      if (teamsError) throw teamsError;

      return challenge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-challenges'] });
      toast.success('Challenge created!');
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deactivateChallenge = useMutation({
    mutationFn: async (challengeId: string) => {
      const { error } = await supabase
        .from('group_challenges')
        .update({ is_active: false })
        .eq('id', challengeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-challenges'] });
      toast.success('Challenge ended');
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setChallengeType('volume');
    setTargetValue(1000);
    setXpReward(200);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setTeams([
      { name: 'Team Alpha', color: TEAM_COLORS[0] },
      { name: 'Team Beta', color: TEAM_COLORS[1] },
    ]);
  };

  const addTeam = () => {
    if (teams.length >= 6) return;
    const colorIndex = teams.length % TEAM_COLORS.length;
    setTeams([...teams, { name: `Team ${teams.length + 1}`, color: TEAM_COLORS[colorIndex] }]);
  };

  const removeTeam = (index: number) => {
    if (teams.length <= 2) return;
    setTeams(teams.filter((_, i) => i !== index));
  };

  const updateTeam = (index: number, field: keyof TeamInput, value: string) => {
    const updated = [...teams];
    updated[index] = { ...updated[index], [field]: value };
    setTeams(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold flex items-center gap-2">
          <Swords className="w-5 h-5 text-primary" />
          Group Challenges ({challenges.length})
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Group Challenge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. March Volume War" />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Challenge details..." rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={challengeType} onValueChange={setChallengeType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="volume">Total Volume (kg)</SelectItem>
                      <SelectItem value="frequency">Workout Count</SelectItem>
                      <SelectItem value="streak">Streak Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target</Label>
                  <Input type="number" value={targetValue} onChange={e => setTargetValue(Number(e.target.value))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>XP Reward</Label>
                <Input type="number" value={xpReward} onChange={e => setXpReward(Number(e.target.value))} />
              </div>

              {/* Teams */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Teams ({teams.length})</Label>
                  {teams.length < 6 && (
                    <Button type="button" variant="ghost" size="sm" onClick={addTeam}>
                      <Plus className="w-3 h-3 mr-1" /> Add Team
                    </Button>
                  )}
                </div>
                {teams.map((team, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={team.color}
                      onChange={e => updateTeam(i, 'color', e.target.value)}
                      className="w-8 h-8 rounded border-0 cursor-pointer"
                    />
                    <Input
                      value={team.name}
                      onChange={e => updateTeam(i, 'name', e.target.value)}
                      placeholder="Team name"
                      className="flex-1"
                    />
                    {teams.length > 2 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeTeam(i)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                onClick={() => createChallenge.mutate()}
                disabled={createChallenge.isPending || !title || !endDate}
              >
                {createChallenge.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Swords className="w-4 h-4 mr-2" />
                )}
                Create Challenge
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Swords className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No active challenges</p>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map(challenge => {
            const totalMembers = challenge.teams?.reduce((acc, t) => acc + (t.members?.length || 0), 0) || 0;
            return (
              <Card key={challenge.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{challenge.title}</h3>
                      {challenge.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{challenge.description}</p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deactivateChallenge.mutate(challenge.id)}
                      disabled={deactivateChallenge.isPending}
                    >
                      End
                    </Button>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="gap-1">
                      <Trophy className="w-3 h-3" /> {challenge.xp_reward} XP
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Users className="w-3 h-3" /> {totalMembers} members
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="w-3 h-3" /> {format(new Date(challenge.end_date), 'MMM d')}
                    </Badge>
                    <Badge variant="secondary">{challenge.challenge_type}</Badge>
                  </div>

                  {/* Team bars */}
                  <div className="space-y-2">
                    {challenge.teams?.map(team => {
                      const pct = challenge.target_value > 0
                        ? Math.min(100, (team.total_score / challenge.target_value) * 100)
                        : 0;
                      return (
                        <div key={team.id} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium">{team.name}</span>
                            <span className="text-muted-foreground">
                              {team.total_score} / {challenge.target_value} · {team.members?.length || 0} members
                            </span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: team.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
