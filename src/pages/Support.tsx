import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMyTickets, useCreateTicket } from '@/hooks/useSupportTickets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';
import { 
  MessageSquare, Plus, Loader2, ChevronLeft, Clock, CheckCircle2, AlertCircle, Send
} from 'lucide-react';
import { format } from 'date-fns';

export default function Support() {
  const { user, loading: authLoading } = useAuth();
  const { data: tickets, isLoading } = useMyTickets();
  const createTicket = useCreateTicket();
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '' });
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleCreateTicket = async () => {
    await createTicket.mutateAsync(newTicket);
    setCreateDialogOpen(false);
    setNewTicket({ subject: '', message: '' });
  };

  const currentTicket = tickets?.find(t => t.id === selectedTicket);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Support</h1>
            <p className="text-sm text-muted-foreground">Get help from our team</p>
          </div>
        </div>
      </header>

      <main className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : selectedTicket && currentTicket ? (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to tickets
            </Button>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{currentTicket.subject}</CardTitle>
                    <CardDescription>
                      {format(new Date(currentTicket.created_at), 'MMM d, yyyy h:mm a')}
                    </CardDescription>
                  </div>
                  <Badge variant={currentTicket.status === 'resolved' ? 'default' : 'secondary'}>
                    {currentTicket.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Your message</p>
                  <p className="text-sm">{currentTicket.message}</p>
                </div>

                {currentTicket.responses && currentTicket.responses.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Responses</h4>
                    {currentTicket.responses.map((resp) => (
                      <div key={resp.id} className="p-3 bg-primary/10 rounded-lg">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{resp.responder_name}</span>
                          <span>{format(new Date(resp.created_at), 'MMM d, h:mm a')}</span>
                        </div>
                        <p className="text-sm">{resp.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Waiting for a response from our team...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">My Tickets</h2>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Support Ticket</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input
                        value={newTicket.subject}
                        onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                        placeholder="Brief description of your issue"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea
                        value={newTicket.message}
                        onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                        placeholder="Describe your issue in detail..."
                        rows={4}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleCreateTicket}
                      disabled={createTicket.isPending || !newTicket.subject || !newTicket.message}
                    >
                      {createTicket.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Submit Ticket
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {tickets?.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No support tickets yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Need help? Create a ticket and our team will respond.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets?.map((ticket) => (
                  <Card 
                    key={ticket.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedTicket(ticket.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(ticket.status)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                          </p>
                          <p className="text-sm text-muted-foreground truncate mt-1">{ticket.message}</p>
                        </div>
                        {ticket.responses && ticket.responses.length > 0 && (
                          <Badge variant="default" className="shrink-0">
                            {ticket.responses.length} replies
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
