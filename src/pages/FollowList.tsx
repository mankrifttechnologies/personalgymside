import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
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
import { ArrowLeft, UserPlus, UserMinus, Users, Search, UserCheck, X, Loader2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { FollowSuggestions } from '@/components/FollowSuggestions';

interface FollowUser {
  id: string;
  user_id: string;
  name: string | null;
  avatar_url: string | null;
}

const PAGE_SIZE = 20;

export default function FollowList() {
  const { userId, tab } = useParams<{ userId: string; tab: 'followers' | 'following' }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFollowing, toggleFollow, isLoading: followLoading } = useFollows();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(tab || 'followers');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const isOwnProfile = user?.id === userId;

  // Infinite scroll for followers
  const {
    data: followersData,
    fetchNextPage: fetchNextFollowers,
    hasNextPage: hasMoreFollowers,
    isFetchingNextPage: isFetchingMoreFollowers,
    isLoading: followersLoading,
  } = useInfiniteQuery({
    queryKey: ['follow-list-followers-infinite', userId, searchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) return { items: [], nextPage: null };
      
      const { data, error } = await supabase
        .from('member_follows')
        .select('follower_id')
        .eq('following_id', userId)
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);
      
      if (error) throw error;
      if (data.length === 0) return { items: [], nextPage: null };

      const userIds = data.map(f => f.follower_id);
      let profilesQuery = supabase
        .from('profiles')
        .select('id, user_id, name, avatar_url')
        .in('user_id', userIds);
      
      if (searchQuery.trim()) {
        profilesQuery = profilesQuery.ilike('name', `%${searchQuery}%`);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;
      if (profilesError) throw profilesError;

      return {
        items: (profiles || []) as FollowUser[],
        nextPage: data.length === PAGE_SIZE ? pageParam + 1 : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!userId,
  });

  // Infinite scroll for following
  const {
    data: followingData,
    fetchNextPage: fetchNextFollowing,
    hasNextPage: hasMoreFollowing,
    isFetchingNextPage: isFetchingMoreFollowing,
    isLoading: followingLoading,
  } = useInfiniteQuery({
    queryKey: ['follow-list-following-infinite', userId, searchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) return { items: [], nextPage: null };
      
      const { data, error } = await supabase
        .from('member_follows')
        .select('following_id')
        .eq('follower_id', userId)
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);
      
      if (error) throw error;
      if (data.length === 0) return { items: [], nextPage: null };

      const userIds = data.map(f => f.following_id);
      let profilesQuery = supabase
        .from('profiles')
        .select('id, user_id, name, avatar_url')
        .in('user_id', userIds);
      
      if (searchQuery.trim()) {
        profilesQuery = profilesQuery.ilike('name', `%${searchQuery}%`);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;
      if (profilesError) throw profilesError;

      return {
        items: (profiles || []) as FollowUser[],
        nextPage: data.length === PAGE_SIZE ? pageParam + 1 : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!userId,
  });

  // Flatten paginated data
  const followers = useMemo(() => 
    followersData?.pages.flatMap(page => page.items) || [], 
    [followersData]
  );
  
  const following = useMemo(() => 
    followingData?.pages.flatMap(page => page.items) || [], 
    [followingData]
  );

  // Check if a user is a mutual follower
  const isMutualFollower = useCallback((profileUserId: string) => {
    const isInFollowers = followers.some(f => f.user_id === profileUserId);
    const isInFollowing = following.some(f => f.user_id === profileUserId);
    return isInFollowers && isInFollowing;
  }, [followers, following]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (activeTab === 'followers' && hasMoreFollowers && !isFetchingMoreFollowers) {
            fetchNextFollowers();
          } else if (activeTab === 'following' && hasMoreFollowing && !isFetchingMoreFollowing) {
            fetchNextFollowing();
          }
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [activeTab, hasMoreFollowers, hasMoreFollowing, isFetchingMoreFollowers, isFetchingMoreFollowing, fetchNextFollowers, fetchNextFollowing]);

  const renderUserCard = (profile: FollowUser, showMutualBadge = false) => {
    const isCurrentUser = user?.id === profile.user_id;
    const isFollowingUser = isFollowing(profile.user_id);
    const isMutual = isMutualFollower(profile.user_id);

    return (
      <Card key={profile.user_id} className="overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to={`/member/${profile.user_id}`}>
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {profile.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link to={`/member/${profile.user_id}`}>
                  <p className="font-semibold text-sm truncate hover:underline max-w-[120px] sm:max-w-none">
                    {profile.name || 'Unknown User'}
                  </p>
                </Link>
                {showMutualBadge && isMutual && (
                  <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0 h-5 flex items-center gap-0.5 shrink-0">
                    <UserCheck className="w-3 h-3" />
                    <span className="hidden xs:inline">Mutual</span>
                  </Badge>
                )}
              </div>
              {isMutual && !showMutualBadge && (
                <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
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
                className="h-8 px-2 sm:px-3 text-xs shrink-0"
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

  const renderList = (
    users: FollowUser[], 
    loading: boolean, 
    emptyMessage: string, 
    showMutualBadge = false,
    hasMore?: boolean,
    isFetchingMore?: boolean
  ) => {
    if (loading && users.length === 0) {
      return (
        <div className="space-y-2 sm:space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 sm:h-20 w-full rounded-xl" />
          ))}
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="text-center py-6 sm:py-12">
          <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm sm:text-base">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {users.map((profile) => renderUserCard(profile, showMutualBadge))}
        
        {/* Load more trigger */}
        <div ref={loadMoreRef} className="h-4" />
        
        {isFetchingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
        
        {hasMore === false && users.length > 0 && (
          <p className="text-center text-xs text-muted-foreground py-2">
            No more to load
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-28 safe-area-top">
      <div className="container max-w-lg mx-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9 shrink-0">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h1 className="text-base sm:text-xl font-bold truncate">
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
            className="pl-9 pr-9 h-10 text-sm"
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
        <Tabs 
          defaultValue={tab || 'followers'} 
          className="w-full"
          onValueChange={(v) => setActiveTab(v as 'followers' | 'following')}
        >
          <TabsList className="grid w-full grid-cols-2 h-10">
            <TabsTrigger value="followers" className="gap-1 text-xs sm:text-sm">
              Followers
              <span className="text-[10px] sm:text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {followers.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="following" className="gap-1 text-xs sm:text-sm">
              Following
              <span className="text-[10px] sm:text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {following.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
            {searchQuery && followers.length > 0 && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Showing results matching "{searchQuery}"
              </p>
            )}
            {renderList(
              followers,
              followersLoading,
              searchQuery 
                ? "No followers match your search" 
                : isOwnProfile 
                  ? "You don't have any followers yet" 
                  : "No followers yet",
              true,
              hasMoreFollowers,
              isFetchingMoreFollowers
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
            {searchQuery && following.length > 0 && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Showing results matching "{searchQuery}"
              </p>
            )}
            {renderList(
              following,
              followingLoading,
              searchQuery 
                ? "No following match your search" 
                : isOwnProfile 
                  ? "You're not following anyone yet" 
                  : "Not following anyone yet",
              false,
              hasMoreFollowing,
              isFetchingMoreFollowing
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