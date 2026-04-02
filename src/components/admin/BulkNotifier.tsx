import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMembersByFilter, useSendBulkMessage } from '@/hooks/useCommunications';
import { Send, Loader2, Users, Filter } from 'lucide-react';

export default function BulkNotifier() {
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const { data: members = [] } = useMembersByFilter();
  const sendBulk = useSendBulkMessage();

  const filteredMembers = members.filter(m => {
    if (!m.is_approved) return false;
    if (filter === 'all') return true;
    if (filter === 'bronze' || filter === 'silver' || filter === 'gold' || filter === 'platinum') return m.tier === filter;
    return true;
  });

  const handleSend = () => {
    if (!message.trim() || filteredMembers.length === 0) return;
    const recipientIds = filteredMembers.map(m => m.user_id);
    sendBulk.mutate({ recipientIds, content: message });
    setMessage('');
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Send className="w-4 h-4 text-primary" />
          Bulk Message
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              <SelectItem value="bronze">Bronze Tier</SelectItem>
              <SelectItem value="silver">Silver Tier</SelectItem>
              <SelectItem value="gold">Gold Tier</SelectItem>
              <SelectItem value="platinum">Platinum Tier</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-[10px] shrink-0">
            <Users className="w-3 h-3 mr-1" />
            {filteredMembers.length}
          </Badge>
        </div>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message to members..."
          className="min-h-[80px] text-sm"
          maxLength={500}
        />

        <div className="flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground">{message.length}/500</span>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!message.trim() || filteredMembers.length === 0 || sendBulk.isPending}
          >
            {sendBulk.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <Send className="w-4 h-4 mr-1" />
            )}
            Send to {filteredMembers.length}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
