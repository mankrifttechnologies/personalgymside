import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { useMemberSearch } from '@/hooks/useMemberSearch';
import BottomNav from '@/components/BottomNav';
import FriendChat from '@/components/FriendChat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, MessageCircle, Search, Loader2, Users, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';

export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, isLoading } = useConversations();
  const [selectedChat, setSelectedChat] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const { data: members, isLoading: membersLoading } = useMemberSearch(memberSearchQuery);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const filteredConversations = conversations.filter(conv =>
    conv.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      {/* Header */}
      <div className="glass sticky top-0 z-40 border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold flex items-center gap-2">
                Messages
                {totalUnread > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {totalUnread}
                  </Badge>
                )}
              </h1>
              <p className="text-sm text-muted-foreground">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={() => { setNewChatOpen(true); setMemberSearchQuery(''); }}
              className="shrink-0"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {searchQuery
                ? 'Try a different search term'
                : 'Start a conversation with gym members'}
            </p>
            {!searchQuery && (
              <Button
                variant="outline"
                onClick={() => navigate('/explorer')}
                className="gap-2"
              >
                <Users className="w-4 h-4" />
                Find Members
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conv) => (
              <button
                key={conv.partnerId}
                onClick={() => setSelectedChat({ id: conv.partnerId, name: conv.partnerName })}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-accent transition-colors border border-border"
              >
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conv.partnerAvatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {conv.partnerName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-medium truncate ${conv.unreadCount > 0 ? 'text-foreground' : ''}`}>
                      {conv.partnerName}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: true })}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {conv.isLastMessageFromMe && <span className="text-muted-foreground">You: </span>}
                    {conv.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat Sheet */}
      <Sheet open={!!selectedChat} onOpenChange={() => setSelectedChat(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
          <SheetHeader className="px-4 pt-4 pb-2 border-b border-border">
            <SheetTitle className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedChat(null)}
                className="shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              {selectedChat?.name}
            </SheetTitle>
          </SheetHeader>
          {selectedChat && (
            <FriendChat friendId={selectedChat.id} friendName={selectedChat.name} />
          )}
        </SheetContent>
      </Sheet>

      {/* New Conversation Dialog */}
      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[50vh]">
            {membersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !members?.length ? (
              <p className="text-center text-muted-foreground text-sm py-8">No members found</p>
            ) : (
              members
                .filter(m => m.user_id !== user.id)
                .map((member) => (
                  <button
                    key={member.user_id}
                    onClick={() => {
                      setNewChatOpen(false);
                      setSelectedChat({ id: member.user_id, name: member.name || 'Unknown' });
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {(member.name || '?').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-medium text-sm">{member.name || 'Unknown User'}</p>
                      {member.fitness_goal && (
                        <p className="text-xs text-muted-foreground capitalize">{member.fitness_goal}</p>
                      )}
                    </div>
                  </button>
                ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
