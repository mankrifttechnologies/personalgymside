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
      <span className="text-[11px] bg-muted text-muted-foreground px-3 py-1 rounded-full font-medium">
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group messages with date separators
  let lastDate: Date | null = null;

  return (
    <div className="flex flex-col h-[calc(85vh-80px)]">
      {/* Chat background pattern */}
      <div className="flex-1 overflow-y-auto px-3 py-2" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--muted)) 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }}>
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <Send className="w-7 h-7 text-primary" />
            </div>
            <p className="text-sm font-medium">Start chatting with {friendName || 'your friend'}</p>
            <p className="text-xs text-muted-foreground mt-1">Say hello! 👋</p>
          </div>
        ) : (
          <>
            {messages.map((message, idx) => {
              const isMe = message.sender_id === user?.id;
              const msgDate = new Date(message.created_at);
              let showDate = false;
              if (!lastDate || !isSameDay(lastDate, msgDate)) {
                showDate = true;
                lastDate = msgDate;
              }

              // Check if next message is from same sender for tail grouping
              const nextMsg = messages[idx + 1];
              const isLastInGroup = !nextMsg || nextMsg.sender_id !== message.sender_id || 
                (nextMsg && !isSameDay(new Date(nextMsg.created_at), msgDate));

              return (
                <div key={message.id}>
                  {showDate && <DateSeparator date={msgDate} />}
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-0.5 ${isLastInGroup ? 'mb-2' : ''}`}>
                    <div
                      className={`max-w-[78%] px-3 py-1.5 relative ${
                        isMe
                          ? `bg-primary text-primary-foreground ${isLastInGroup ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl'}`
                          : `bg-card border border-border ${isLastInGroup ? 'rounded-2xl rounded-bl-sm' : 'rounded-2xl'}`
                      }`}
                    >
                      <p className="text-[14px] leading-relaxed break-words">{message.content}</p>
                      <div className={`flex items-center justify-end gap-1 -mb-0.5 mt-0.5 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                        <span className="text-[10px]">{format(msgDate, 'HH:mm')}</span>
                        {isMe && (
                          message.is_read
                            ? <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                            : <Check className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Typing indicator */}
        {friendIsTyping && (
          <div className="flex justify-start mb-2">
            <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-2.5">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp-style Input Bar */}
      <div className="p-2 border-t border-border bg-background">
        <div className="flex items-end gap-2">
          <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-full px-4 py-1">
            <Smile className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              placeholder="Message"
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              className="flex-1 bg-transparent text-sm py-2 outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Button
            size="icon"
            className="rounded-full w-10 h-10 shrink-0 bg-primary hover:bg-primary/90"
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMessage.isPending}
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
