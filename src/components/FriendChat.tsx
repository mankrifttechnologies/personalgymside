import { useState, useRef, useEffect } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Check, CheckCheck, Smile, Image, Mic } from 'lucide-react';
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
    <div className="flex items-center justify-center my-4">
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  let lastDate: Date | null = null;

  return (
    <div className="flex flex-col h-[calc(100dvh-56px)]">
      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 py-3"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--muted)/0.5) 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Send className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold mb-1">Start a conversation</p>
            <p className="text-xs text-muted-foreground">
              Say hello to {friendName || 'your friend'} 👋
            </p>
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

              const nextMsg = messages[idx + 1];
              const prevMsg = messages[idx - 1];
              const isLastInGroup = !nextMsg || nextMsg.sender_id !== message.sender_id ||
                (nextMsg && !isSameDay(new Date(nextMsg.created_at), msgDate));
              const isFirstInGroup = !prevMsg || prevMsg.sender_id !== message.sender_id ||
                (prevMsg && !isSameDay(new Date(prevMsg.created_at), msgDate)) || showDate;

              // Dynamic border radius based on grouping
              const getRadius = () => {
                if (isMe) {
                  if (isFirstInGroup && isLastInGroup) return 'rounded-2xl rounded-br-md';
                  if (isFirstInGroup) return 'rounded-2xl rounded-br-md';
                  if (isLastInGroup) return 'rounded-2xl rounded-tr-md rounded-br-md';
                  return 'rounded-2xl rounded-tr-md rounded-br-md';
                } else {
                  if (isFirstInGroup && isLastInGroup) return 'rounded-2xl rounded-bl-md';
                  if (isFirstInGroup) return 'rounded-2xl rounded-bl-md';
                  if (isLastInGroup) return 'rounded-2xl rounded-tl-md rounded-bl-md';
                  return 'rounded-2xl rounded-tl-md rounded-bl-md';
                }
              };

              return (
                <div key={message.id}>
                  {showDate && <DateSeparator date={msgDate} />}
                  <div
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-2.5' : 'mb-[3px]'}`}
                  >
                    <div
                      className={`max-w-[75%] px-3.5 py-2 ${getRadius()} ${
                        isMe
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border shadow-sm'
                      }`}
                    >
                      <p className="text-[14px] leading-[1.4] break-words whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-primary-foreground/50' : 'text-muted-foreground/70'}`}>
                        <span className="text-[10px] leading-none">{format(msgDate, 'HH:mm')}</span>
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
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1.5 items-center h-4">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.6s' }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar - Instagram style */}
      <div className="px-3 py-2 border-t border-border bg-background pb-[calc(env(safe-area-inset-bottom,8px)+8px)]">
        <div className="flex items-end gap-2">
          <div className="flex-1 flex items-center gap-2 bg-muted rounded-full px-4 py-1.5 min-h-[44px]">
            <Smile className="w-5 h-5 text-muted-foreground shrink-0 cursor-pointer hover:text-foreground transition-colors" />
            <input
              ref={inputRef}
              placeholder="Message..."
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              className="flex-1 bg-transparent text-sm py-1.5 outline-none placeholder:text-muted-foreground min-w-0"
            />
            {!newMessage.trim() && (
              <Image className="w-5 h-5 text-muted-foreground shrink-0 cursor-pointer hover:text-foreground transition-colors" />
            )}
          </div>
          {newMessage.trim() ? (
            <Button
              size="icon"
              className="rounded-full w-11 h-11 shrink-0 shadow-lg shadow-primary/20"
              onClick={handleSend}
              disabled={sendMessage.isPending}
            >
              {sendMessage.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full w-11 h-11 shrink-0"
            >
              <Mic className="w-5 h-5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
