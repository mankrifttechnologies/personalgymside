import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import { usePersonalRecords } from '@/hooks/usePersonalRecords';
import { useUnreadMessages } from '@/hooks/useMessages';
import BottomNav from '@/components/BottomNav';
import FriendChat from '@/components/FriendChat';
import FriendProfileView from '@/components/FriendProfileView';
import ActivityFeed from '@/components/ActivityFeed';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, ChevronLeft, Copy, Check, UserPlus, X, 
  Trophy, Loader2, Share2, RefreshCw, MessageCircle, Eye, Activity
} from 'lucide-react';
import { toast } from 'sonner';

export default function Friends() {
  const { user, loading: authLoading } = useAuth();
  const { 
    myProfile, 
    acceptedFriends, 
    pendingRequests, 
    sentRequests,
    isLoading,
    generateCode,
    sendFriendRequest,
    acceptRequest,
    removeFriend,
  } = useFriends();
  const { records } = usePersonalRecords();
  const { unreadCount } = useUnreadMessages();
  
  const [friendCode, setFriendCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<{
    id: string;
    friendshipId: string;
    name?: string;
  } | null>(null);
  const [sheetMode, setSheetMode] = useState<'chat' | 'profile'>('chat');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-glow p-4 rounded-full bg-primary/20">
          <Users className="w-8 h-8 text-primary animate-float" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleCopyCode = () => {
    if (myProfile?.friend_code) {
      navigator.clipboard.writeText(myProfile.friend_code);
      setCopied(true);
      toast.success('Code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateCode = async () => {
    try {
      await generateCode.mutateAsync();
      toast.success('Friend code generated!');
    } catch (error) {
      toast.error('Failed to generate code');
    }
  };

  const handleSendRequest = async () => {
    if (!friendCode.trim()) {
      toast.error('Please enter a friend code');
      return;
    }
    try {
      await sendFriendRequest.mutateAsync(friendCode.trim());
      toast.success('Friend request sent!');
      setFriendCode('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send request');
    }
  };

  const handleAccept = async (friendshipId: string) => {
    try {
      await acceptRequest.mutateAsync(friendshipId);
      toast.success('Friend request accepted!');
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const handleRemove = async (friendshipId: string) => {
    try {
      await removeFriend.mutateAsync(friendshipId);
      toast.success('Removed');
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  const openChat = (friendId: string, friendshipId: string, name?: string) => {
    setSelectedFriend({ id: friendId, friendshipId, name });
    setSheetMode('chat');
  };

  const openProfile = (friendId: string, friendshipId: string, name?: string) => {
    setSelectedFriend({ id: friendId, friendshipId, name });
    setSheetMode('profile');
  };

  // Get top PRs for sharing
  const topPRs = records?.slice(0, 3) || [];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="p-4 flex items-center gap-3">
        <Link to="/profile">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Friends</h1>
          <p className="text-sm text-muted-foreground">Connect & chat</p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20">
            <MessageCircle className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">{unreadCount}</span>
          </div>
        )}
      </header>

      <main className="px-4 space-y-6">
        {/* Tabs for Friends and Activity */}
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="activity" className="gap-1">
              <Activity className="w-4 h-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-4 space-y-6">
            {/* Your Friend Code */}
            <div className="glass rounded-xl p-4 animate-slide-up">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                Your Friend Code
              </h3>
              
              {myProfile?.friend_code ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 rounded-lg bg-secondary text-center">
                    <span className="text-2xl font-mono font-bold tracking-wider">
                      {myProfile.friend_code}
                    </span>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="icon"
                    onClick={handleCopyCode}
                  >
                    {copied ? <Check className="w-5 h-5 text-accent" /> : <Copy className="w-5 h-5" />}
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="energy" 
                  className="w-full"
                  onClick={handleGenerateCode}
                  disabled={generateCode.isPending}
                >
                  {generateCode.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Generate Friend Code
                </Button>
              )}
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Share this code with friends to connect
              </p>
            </div>

            {/* Add Friend */}
            <div className="glass rounded-xl p-4 animate-slide-up">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-accent" />
                Add Friend
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter friend code..."
                  value={friendCode}
                  onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase tracking-wider"
                  maxLength={8}
                />
                <Button 
                  variant="energy"
                  onClick={handleSendRequest}
                  disabled={sendFriendRequest.isPending}
                >
                  {sendFriendRequest.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Add'
                  )}
                </Button>
              </div>
            </div>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="glass rounded-xl p-4 animate-slide-up">
                <h3 className="font-semibold mb-3">Friend Requests</h3>
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <div 
                      key={request.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-sm">
                          {request.profile?.name || 'New Request'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleAccept(request.id)}
                          disabled={acceptRequest.isPending}
                        >
                          <Check className="w-4 h-4 text-accent" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemove(request.id)}
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Your Top PRs */}
            {topPRs.length > 0 && (
              <div className="glass rounded-xl p-4 animate-slide-up">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-warning" />
                  Your Top PRs
                </h3>
                <div className="space-y-2">
                  {topPRs.map((pr, idx) => (
                    <div 
                      key={pr.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${
                          idx === 0 ? 'text-warning' : idx === 1 ? 'text-muted-foreground' : 'text-orange-600'
                        }`}>
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{pr.exercise_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{pr.muscle_group}</p>
                        </div>
                      </div>
                      <span className="text-primary font-bold">
                        {pr.max_weight_kg}kg × {pr.max_reps}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            <div className="glass rounded-xl p-4 animate-slide-up">
              <h3 className="font-semibold mb-3">Friends ({acceptedFriends.length})</h3>
              
              {acceptedFriends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No friends yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share your code or add friends to connect
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {acceptedFriends.map((friend) => (
                    <div 
                      key={friend.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-accent" />
                        </div>
                        <span className="font-medium text-sm">
                          {friend.profile?.name || 'Friend'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openProfile(friend.friendUserId, friend.id, friend.profile?.name)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openChat(friend.friendUserId, friend.id, friend.profile?.name)}
                        >
                          <MessageCircle className="w-4 h-4 text-primary" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemove(friend.id)}
                        >
                          <X className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sent Requests */}
            {sentRequests.length > 0 && (
              <div className="glass rounded-xl p-4 animate-slide-up">
                <h3 className="font-semibold mb-3 text-muted-foreground">Pending Sent Requests</h3>
                <div className="space-y-2">
                  {sentRequests.map((request) => (
                    <div 
                      key={request.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Users className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <span className="text-sm text-muted-foreground">Request sent</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemove(request.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <div className="glass rounded-xl p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Friend Activity
              </h3>
              <ActivityFeed showOnlyFriends />
            </div>
          </TabsContent>
        </Tabs>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </main>

      {/* Chat/Profile Sheet */}
      <Sheet open={!!selectedFriend} onOpenChange={(open) => !open && setSelectedFriend(null)}>
        <SheetContent className="w-full sm:max-w-md p-0">
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
              <Button 
                variant={sheetMode === 'chat' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => setSheetMode('chat')}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Chat
              </Button>
              <Button 
                variant={sheetMode === 'profile' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => setSheetMode('profile')}
              >
                <Eye className="w-4 h-4 mr-1" />
                Profile
              </Button>
            </div>
            <SheetTitle>{selectedFriend?.name || 'Friend'}</SheetTitle>
            <SheetDescription>
              {sheetMode === 'chat' ? 'Send messages' : 'View profile'}
            </SheetDescription>
          </SheetHeader>
          
          {selectedFriend && (
            <div className="overflow-y-auto">
              {sheetMode === 'chat' ? (
                <FriendChat 
                  friendId={selectedFriend.id} 
                  friendName={selectedFriend.name} 
                />
              ) : (
                <div className="p-4">
                  <FriendProfileView 
                    friendUserId={selectedFriend.id}
                    onStartChat={() => setSheetMode('chat')}
                  />
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  );
}
