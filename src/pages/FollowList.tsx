import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFollows } from '@/hooks/useFollows';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, UserPlus, UserMinus, Users, Search, UserCheck, X } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { FollowSuggestions } from '@/components/FollowSuggestions';

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
  const { isFollowing, toggleFollow, isLoading: followLoading, followers: myFollowers } = useFollows();
  const [searchQuery, setSearchQuery] = useState('');

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

  // Check if a user is a mutual follower (they follow the profile owner AND profile owner follows them)
  const isMutualFollower = (profileUserId: string) => {
    // Check if this user is in both followers and following lists
    const isInFollowers = followers.some(f => f.user_id === profileUserId);
    const isInFollowing = following.some(f => f.user_id === profileUserId);
    return isInFollowers && isInFollowing;
  };

  // Filter users based on search query
  const filteredFollowers = useMemo(() => {
    if (!searchQuery.trim()) return followers;
    return followers.filter(f => 
      f.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [followers, searchQuery]);

  const filteredFollowing = useMemo(() => {
    if (!searchQuery.trim()) return following;
    return following.filter(f => 
      f.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [following, searchQuery]);

  const renderUserCard = (profile: FollowUser, showMutualBadge = false) => {
    const isCurrentUser = user?.id === profile.user_id;
    const isFollowingUser = isFollowing(profile.user_id);
    const isMutual = isMutualFollower(profile.user_id);

    return (
      <Card key={profile.user_id} className="overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to={`/member/${profile.user_id}`}>
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {profile.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link to={`/member/${profile.user_id}`}>
                  <p className="font-semibold text-sm sm:text-base truncate hover:underline">
                    {profile.name || 'Unknown User'}
                  </p>
                </Link>
                {showMutualBadge && isMutual && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    <span className="hidden xs:inline">Mutual</span>
                  </Badge>
                )}
              </div>
              {isMutual && !showMutualBadge && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  Follows you back
                </p>
              )}
            </div>
            {user && !isCurrentUser && (
              <Button
                size="sm"
                variant={isFollowingUser ? 'outline' : 'default'}
                onClick={() => toggleFollow(profile.user_id)}
                disabled={followLoading}
                className="h-8 px-2 sm:px-3 text-xs sm:text-sm"
              >
                {isFollowingUser ? (
                  <>
                    <UserMinus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Unfollow</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Follow</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderList = (users: FollowUser[], loading: boolean, emptyMessage: string, showMutualBadge = false) => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 sm:h-20 w-full rounded-xl" />
          ))}
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="text-center py-8 sm:py-12">
          <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm sm:text-base">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-2 sm:space-y-3">
        {users.map((profile) => renderUserCard(profile, showMutualBadge))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-lg mx-auto p-3 sm:p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9 sm:h-10 sm:w-10">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h1 className="text-lg sm:text-xl font-bold">
            {isOwnProfile ? 'Your Connections' : 'Connections'}
          </h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue={tab || 'followers'} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers" className="gap-1 text-xs sm:text-sm">
              Followers
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {followers.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="following" className="gap-1 text-xs sm:text-sm">
              Following
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {following.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="mt-4 space-y-4">
            {searchQuery && filteredFollowers.length !== followers.length && (
              <p className="text-xs text-muted-foreground">
                Showing {filteredFollowers.length} of {followers.length} followers
              </p>
            )}
            {renderList(
              filteredFollowers,
              followersLoading,
              searchQuery 
                ? "No followers match your search" 
                : isOwnProfile 
                  ? "You don't have any followers yet" 
                  : "No followers yet",
              true
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-4 space-y-4">
            {searchQuery && filteredFollowing.length !== following.length && (
              <p className="text-xs text-muted-foreground">
                Showing {filteredFollowing.length} of {following.length} following
              </p>
            )}
            {renderList(
              filteredFollowing,
              followingLoading,
              searchQuery 
                ? "No following match your search" 
                : isOwnProfile 
                  ? "You're not following anyone yet" 
                  : "Not following anyone yet"
            )}
          </TabsContent>
        </Tabs>

        {/* Follow Suggestions */}
        {isOwnProfile && !searchQuery && (
          <FollowSuggestions />
        )}
      </div>
      <BottomNav />
    </div>
  );
}
