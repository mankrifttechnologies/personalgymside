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
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, MessageCircle, Search, Loader2, Users, Plus, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';

export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, isLoading } = useConversations();
  const [selectedChat, setSelectedChat] = useState<{ id: string; name: string; avatar?: string | null } | null>(null);
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
      {/* WhatsApp-style Header */}
      <div className="bg-primary text-primary-foreground sticky top-0 z-40 pt-[env(safe-area-inset-top,0px)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                Messages
                {totalUnread > 0 && (
                  <span className="bg-primary-foreground text-primary text-xs px-2 py-0.5 rounded-full font-bold">
                    {totalUnread}
                  </span>
                )}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => { setNewChatOpen(true); setMemberSearchQuery(''); }}>
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
        {/* Search bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/50" />
            <input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/50 rounded-full pl-10 pr-4 py-2 text-sm outline-none focus:bg-primary-foreground/20 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-1">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {searchQuery ? 'Try a different search term' : 'Start a conversation with gym members'}
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate('/explorer')} className="gap-2 rounded-full">
                <Users className="w-4 h-4" />
                Find Members
              </Button>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <button
              key={conv.partnerId}
              onClick={() => setSelectedChat({ id: conv.partnerId, name: conv.partnerName, avatar: conv.partnerAvatar })}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors active:bg-accent"
            >
              <Avatar className="w-12 h-12 shrink-0">
                <AvatarImage src={conv.partnerAvatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {conv.partnerName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm truncate">{conv.partnerName}</span>
                  <span className={`text-[11px] shrink-0 ${conv.unreadCount > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                    {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: false })}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className={`text-[13px] truncate ${conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {conv.isLastMessageFromMe && <span className="text-muted-foreground">You: </span>}
                    {conv.lastMessage}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] flex items-center justify-center font-bold shrink-0">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Chat Sheet - Full screen like WhatsApp */}
      <Sheet open={!!selectedChat} onOpenChange={() => setSelectedChat(null)}>
        <SheetContent side="bottom" className="h-[100dvh] p-0 rounded-none">
          {/* Chat header */}
          <div className="bg-primary text-primary-foreground px-2 py-3 flex items-center gap-2 pt-[env(safe-area-inset-top,12px)]">
            <Button variant="ghost" size="icon" onClick={() => setSelectedChat(null)} className="text-primary-foreground hover:bg-primary-foreground/10 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarImage src={selectedChat?.avatar || undefined} />
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs">
                {(selectedChat?.name || '').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{selectedChat?.name}</p>
              <p className="text-[11px] text-primary-foreground/70">tap for info</p>
            </div>
          </div>
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
              members.filter(m => m.user_id !== user.id).map((member) => (
                <button
                  key={member.user_id}
                  onClick={() => {
                    setNewChatOpen(false);
                    setSelectedChat({ id: member.user_id, name: member.name || 'Unknown', avatar: member.avatar_url });
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

      {/* FAB for new chat */}
      <button
        onClick={() => { setNewChatOpen(true); setMemberSearchQuery(''); }}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all z-30"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      <BottomNav />
    </div>
  );
}
