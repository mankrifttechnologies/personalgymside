import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { useMemberSearch } from '@/hooks/useMemberSearch';
import BottomNav from '@/components/BottomNav';
import FriendChat from '@/components/FriendChat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, MessageCircle, Search, Loader2, Users, X, Phone, Video } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { conversations, isLoading } = useConversations();
  const [selectedChat, setSelectedChat] = useState<{ id: string; name: string; avatar?: string | null; prefill?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const { data: members, isLoading: membersLoading } = useMemberSearch(memberSearchQuery);

  // Auto-open chat when navigated with ?to=USER_ID&context=MESSAGE (e.g. from Marketplace)
  const targetUserId = searchParams.get('to');
  const prefillContext = searchParams.get('context');
  useEffect(() => {
    if (!targetUserId || !user) return;
    let cancelled = false;
    (async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('user_id', targetUserId)
        .maybeSingle();
      if (cancelled) return;
      setSelectedChat({
        id: targetUserId,
        name: profile?.name || 'Member',
        avatar: profile?.avatar_url,
        prefill: prefillContext || undefined,
      });
      // Clear params so back button to /messages shows inbox
      setSearchParams({}, { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [targetUserId, prefillContext, user, setSearchParams]);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const filteredConversations = conversations.filter(conv =>
    conv.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) return formatDistanceToNow(date, { addSuffix: false }).replace('about ', '');
    if (diffDays < 1) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Full-screen chat view when a conversation is selected
  if (selectedChat) {
    return (
      <div
        className="fixed inset-0 z-[60] bg-background flex flex-col overflow-hidden"
        style={{ height: '100dvh', paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* Chat Header */}
        <div className="bg-primary text-primary-foreground px-2 py-2 flex items-center gap-2 shrink-0 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedChat(null)}
            className="h-9 w-9 shrink-0 text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-9 h-9 shrink-0 ring-2 ring-primary-foreground/20">
            <AvatarImage src={selectedChat.avatar || undefined} />
            <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold">
              {selectedChat.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="font-semibold text-sm truncate leading-tight">{selectedChat.name}</p>
            <p className="text-[11px] text-primary-foreground/70 leading-tight truncate">Online</p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/10">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/10">
              <Video className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {/* Chat Body */}
        <FriendChat
          friendId={selectedChat.id}
          friendName={selectedChat.name}
          initialDraft={selectedChat.prefill}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-28" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9 -ml-2 text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">
              Messages
              {totalUnread > 0 && (
                <span className="ml-2 text-[10px] bg-primary-foreground text-primary px-1.5 py-0.5 rounded-full font-bold align-middle">
                  {totalUnread}
                </span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => setShowSearch(!showSearch)}
            >
              {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => { setNewChatOpen(true); setMemberSearchQuery(''); }}
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="px-4 pb-3 animate-in slide-in-from-top-2 duration-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/50" />
              <input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-primary-foreground/15 text-primary-foreground placeholder:text-primary-foreground/50 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:bg-primary-foreground/20 transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <MessageCircle className="w-9 h-9 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </h3>
            <p className="text-muted-foreground text-sm mb-5">
              {searchQuery ? 'Try a different search' : 'Start chatting with gym members'}
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate('/explorer')} className="gap-2 rounded-full" size="lg">
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
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors active:bg-muted/60 text-left"
            >
              <Avatar className="w-12 h-12 shrink-0">
                <AvatarImage src={conv.partnerAvatar || undefined} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-sm">
                  {conv.partnerName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[15px] truncate text-foreground">
                    {conv.partnerName}
                  </span>
                  <span className={`text-[11px] shrink-0 ${conv.unreadCount > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                    {formatTime(conv.lastMessageTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className={`text-[13px] truncate leading-snug ${conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {conv.isLastMessageFromMe && <span className="text-muted-foreground">You: </span>}
                    {conv.lastMessage}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="min-w-[20px] h-5 rounded-full bg-primary text-primary-foreground text-[11px] flex items-center justify-center font-bold shrink-0 px-1.5">
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col gap-0 p-0 rounded-2xl overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <DialogHeader>
              <DialogTitle className="text-lg">New message</DialogTitle>
            </DialogHeader>
          </div>
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="pl-10 rounded-xl bg-muted border-0 focus-visible:ring-1"
                autoFocus
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 max-h-[55vh] px-2 pb-4">
            {membersLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !members?.length ? (
              <div className="text-center py-10">
                <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">No members found</p>
              </div>
            ) : (
              members.filter(m => m.user_id !== user.id).map((member) => (
                <button
                  key={member.user_id}
                  onClick={() => {
                    setNewChatOpen(false);
                    setSelectedChat({ id: member.user_id, name: member.name || 'Unknown', avatar: member.avatar_url });
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/70 transition-colors active:bg-muted"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-sm font-bold">
                      {(member.name || '?').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left min-w-0">
                    <p className="font-semibold text-sm truncate">{member.name || 'Unknown User'}</p>
                    {member.fitness_goal && (
                      <p className="text-xs text-muted-foreground capitalize truncate">{member.fitness_goal}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* FAB */}
      <button
        onClick={() => { setNewChatOpen(true); setMemberSearchQuery(''); }}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all z-30"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      <BottomNav />
    </div>
  );
}
