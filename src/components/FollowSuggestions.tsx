import { Link } from 'react-router-dom';
import { useFollowSuggestions } from '@/hooks/useFollowSuggestions';
import { useFollows } from '@/hooks/useFollows';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus, Users, Sparkles } from 'lucide-react';

export function FollowSuggestions() {
  const { suggestions, isLoading } = useFollowSuggestions();
  const { toggleFollow, isLoading: followLoading, isFollowing } = useFollows();

  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Suggested for You
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  // Filter out users already being followed
  const filteredSuggestions = suggestions.filter(s => !isFollowing(s.user_id));

  if (filteredSuggestions.length === 0) {
    return null;
  }

  return (
    <Card className="glass">
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Suggested for You
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-6 pb-3 sm:pb-6">
        {filteredSuggestions.slice(0, 5).map((suggestion) => (
          <div
            key={suggestion.user_id}
            className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <Link to={`/member/${suggestion.user_id}`}>
              <Avatar className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                <AvatarImage src={suggestion.avatar_url || ''} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs sm:text-sm">
                  {suggestion.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/member/${suggestion.user_id}`}>
                <p className="font-medium text-xs sm:text-sm truncate hover:underline">
                  {suggestion.name || 'Unknown User'}
                </p>
              </Link>
              {suggestion.mutual_count > 0 && (
                <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {suggestion.mutual_count} mutual{suggestion.mutual_count > 1 ? 's' : ''}
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toggleFollow(suggestion.user_id)}
              disabled={followLoading}
              className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
            >
              <UserPlus className="h-3 w-3 mr-1" />
              <span className="hidden xs:inline">Follow</span>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
