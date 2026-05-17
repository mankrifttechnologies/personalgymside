import { useState, useRef, useEffect } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Check, CheckCheck, Smile, Paperclip } from 'lucide-react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';

interface FriendChatProps {
  friendId: string;
  friendName?: string;
  /** Optional pre-filled draft message (e.g. when opened from Marketplace "Message seller"). */
  initialDraft?: string;
}

function DateSeparator({ date }: { date: Date }) {
  let label = format(date, 'MMM d, yyyy');
  if (isToday(date)) label = 'Today';
  else if (isYesterday(date)) label = 'Yesterday';
  return (
    <div className="flex items-center justify-center my-3">
      <span className="text-[11px] bg-background/80 backdrop-blur-sm text-muted-foreground px-3 py-1 rounded-full font-medium shadow-sm border border-border/50">
        {label}
      </span>
    </div>
  );
}

export default function FriendChat({ friendId, friendName, initialDraft }: FriendChatProps) {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, markAsRead } = useMessages(friendId);
  const { friendIsTyping, setIsTyping } = useTypingIndicator(friendId);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pre-fill draft message once per friendId switch
  useEffect(() => {
    if (initialDraft) {
      setNewMessage(initialDraft);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendId]);

  // Auto-scroll to bottom on new messages / typing
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, friendIsTyping]);

  useEffect(() => {
    if (friendId) markAsRead.mutate();
  }, [friendId, messages?.length]);

  // When the on-screen keyboard opens (Capacitor / mobile), keep latest message visible
  const handleFocus = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ block: 'end' });
    }, 250);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setIsTyping(false);
    const msg = newMessage.trim();
    setNewMessage('');
    try {
      await sendMessage.mutateAsync(msg);
    } catch {
      setNewMessage(msg);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  let lastDate: Date | null = null;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-muted/20">
      {/* Messages area — WhatsApp-style subtle dotted wallpaper */}
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-3"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground) / 0.18) 1px, transparent 0)',
          backgroundSize: '22px 22px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
              <Send className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold mb-1">Start a conversation</p>
            <p className="text-xs text-muted-foreground">
              Say hello to {friendName || 'your friend'} 👋
            </p>
          </div>
        ) : (
          messages.map((message, idx) => {
            const isMe = message.sender_id === user?.id;
            const msgDate = new Date(message.created_at);
            let showDate = false;
            if (!lastDate || !isSameDay(lastDate, msgDate)) {
              showDate = true;
              lastDate = msgDate;
            }

            const nextMsg = messages[idx + 1];
            const isLastInGroup =
              !nextMsg ||
              nextMsg.sender_id !== message.sender_id ||
              (nextMsg && !isSameDay(new Date(nextMsg.created_at), msgDate));

            return (
              <div key={message.id}>
                {showDate && <DateSeparator date={msgDate} />}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-2' : 'mb-0.5'}`}>
                  <div
                    className={`relative max-w-[75%] pl-2.5 pr-2 pt-1.5 pb-1 shadow-sm ${
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
                        : 'bg-card text-foreground border border-border/60 rounded-2xl rounded-bl-md'
                    }`}
                  >
                    <p className="text-[14.5px] leading-[1.35] break-words whitespace-pre-wrap pr-[58px]">
                      {message.content}
                    </p>
                    <div
                      className={`absolute bottom-1 right-2 flex items-center gap-0.5 ${
                        isMe ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
                      }`}
                    >
                      <span className="text-[10px] leading-none">{format(msgDate, 'HH:mm')}</span>
                      {isMe &&
                        (message.is_read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {friendIsTyping && (
          <div className="flex justify-start mb-2">
            <div className="bg-card border border-border/60 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
              <div className="flex gap-1.5 items-center h-4">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/70 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/70 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.6s' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/70 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar — sticks above the on-screen keyboard via safe-area inset */}
      <div
        className="shrink-0 px-2 pt-2 border-t border-border bg-background"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
      >
        <div className="flex items-end gap-2">
          <div className="flex-1 flex items-center gap-1.5 bg-muted rounded-3xl pl-3 pr-2 min-h-[44px] border border-border/50 focus-within:border-primary/50 transition-colors">
            <Smile className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              placeholder="Message"
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              onFocus={handleFocus}
              enterKeyHint="send"
              autoComplete="off"
              autoCorrect="on"
              className="flex-1 bg-transparent text-[15px] py-2.5 outline-none placeholder:text-muted-foreground min-w-0"
            />
            <Paperclip className="w-5 h-5 text-muted-foreground shrink-0 -rotate-45" />
          </div>
          <Button
            size="icon"
            className="rounded-full w-11 h-11 shrink-0 shadow-md shadow-primary/25 active:scale-95 transition-transform"
            onClick={handleSend}
            disabled={sendMessage.isPending || !newMessage.trim()}
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
