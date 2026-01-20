import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFollows } from '@/hooks/useFollows';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, UserPlus, UserMinus, Users } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface FollowUser {
  id: string;
  user_id: string;
  name: string | null;
  avatar_url: string | null;
}

export default function FollowList() {
  const { userId, tab } = useParams<{ userId: string; tab: 'followers' | 'following' }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFollowing, toggleFollow, isLoading: followLoading } = useFollows();

  const isOwnProfile = user?.id === userId;

  // Fetch followers
  const { data: followers = [], isLoading: followersLoading } = useQuery({
    queryKey: ['follow-list-followers', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('member_follows')
        .select('follower_id')
        .eq('following_id', userId);
      if (error) throw error;
      
      if (data.length === 0) return [];

      // Get profile info for each follower
      const userIds = data.map(f => f.follower_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, name, avatar_url')
        .in('user_id', userIds);
      
      if (profilesError) throw profilesError;
      return profiles as FollowUser[];
    },
    enabled: !!userId,
  });

  // Fetch following
  const { data: following = [], isLoading: followingLoading } = useQuery({
    queryKey: ['follow-list-following', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('member_follows')
        .select('following_id')
        .eq('follower_id', userId);
      if (error) throw error;
      
      if (data.length === 0) return [];

      // Get profile info for each following
      const userIds = data.map(f => f.following_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, name, avatar_url')
        .in('user_id', userIds);
      
      if (profilesError) throw profilesError;
      return profiles as FollowUser[];
    },
    enabled: !!userId,
  });

  const renderUserCard = (profile: FollowUser) => {
    const isCurrentUser = user?.id === profile.user_id;
    const isFollowingUser = isFollowing(profile.user_id);

    return (
      <Card key={profile.user_id} className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Link to={`/member/${profile.user_id}`}>
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {profile.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/member/${profile.user_id}`}>
                <p className="font-semibold truncate hover:underline">
                  {profile.name || 'Unknown User'}
                </p>
              </Link>
            </div>
            {user && !isCurrentUser && (
              <Button
                size="sm"
                variant={isFollowingUser ? 'outline' : 'default'}
                onClick={() => toggleFollow(profile.user_id)}
                disabled={followLoading}
              >
                {isFollowingUser ? (
                  <>
                    <UserMinus className="h-4 w-4 mr-1" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderList = (users: FollowUser[], loading: boolean, emptyMessage: string) => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {users.map(renderUserCard)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-md mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">
            {isOwnProfile ? 'Your Connections' : 'Connections'}
          </h1>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={tab || 'followers'} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers" className="gap-1">
              Followers
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {followers.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="following" className="gap-1">
              Following
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {following.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="mt-4">
            {renderList(
              followers,
              followersLoading,
              isOwnProfile ? "You don't have any followers yet" : "No followers yet"
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-4">
            {renderList(
              following,
              followingLoading,
              isOwnProfile ? "You're not following anyone yet" : "Not following anyone yet"
            )}
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
}
