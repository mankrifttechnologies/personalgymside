import { useState, useRef, useEffect } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Check, CheckCheck, Smile } from 'lucide-react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';

interface FriendChatProps {
  friendId: string;
  friendName?: string;
}

function DateSeparator({ date }: { date: Date }) {
  let label = format(date, 'MMM d, yyyy');
  if (isToday(date)) label = 'Today';
  else if (isYesterday(date)) label = 'Yesterday';
  return (
    <div className="flex items-center justify-center my-3">
      <span className="text-[11px] bg-muted/80 backdrop-blur-sm text-muted-foreground px-3 py-1 rounded-full font-medium shadow-sm">
        {label}
      </span>
    </div>
  );
}

export default function FriendChat({ friendId, friendName }: FriendChatProps) {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, markAsRead } = useMessages(friendId);
  const { friendIsTyping, setIsTyping } = useTypingIndicator(friendId);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (friendId) markAsRead.mutate();
  }, [friendId, messages?.length]);

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
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--muted)/0.3) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
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
            const isLastInGroup = !nextMsg || nextMsg.sender_id !== message.sender_id ||
              (nextMsg && !isSameDay(new Date(nextMsg.created_at), msgDate));

            return (
              <div key={message.id}>
                {showDate && <DateSeparator date={msgDate} />}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-2' : 'mb-0.5'}`}>
                  <div
                    className={`max-w-[78%] px-3 py-1.5 ${
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm'
                        : 'bg-card border border-border rounded-2xl rounded-bl-sm shadow-sm'
                    }`}
                  >
                    <p className="text-[14px] leading-[1.45] break-words whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <div className={`flex items-center justify-end gap-1 mt-0.5 ${isMe ? 'text-primary-foreground/50' : 'text-muted-foreground/60'}`}>
                      <span className="text-[10px] leading-none">{format(msgDate, 'HH:mm')}</span>
                      {isMe && (
                        message.is_read
                          ? <CheckCheck className="w-3.5 h-3.5 text-accent" />
                          : <Check className="w-3.5 h-3.5" />
                      )}
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
            <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
              <div className="flex gap-1.5 items-center h-4">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.6s' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="shrink-0 px-3 py-2 border-t border-border bg-background" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 8px) + 8px)' }}>
        <div className="flex items-end gap-2">
          <div className="flex-1 flex items-center gap-2 bg-muted rounded-full px-4 min-h-[44px]">
            <Smile className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              placeholder="Message..."
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              className="flex-1 bg-transparent text-sm py-2.5 outline-none placeholder:text-muted-foreground min-w-0"
            />
          </div>
          <Button
            size="icon"
            className="rounded-full w-11 h-11 shrink-0 shadow-lg shadow-primary/20"
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
