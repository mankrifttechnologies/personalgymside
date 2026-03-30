import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin, useIsTrainer, useAssignRole } from '@/hooks/useUserRole';
import { useAdminUsers, useApproveUser, useCreateUser } from '@/hooks/useAdminUsers';
import { useAllTickets, useRespondToTicket, useUpdateTicketStatus } from '@/hooks/useSupportTickets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import BottomNav from '@/components/BottomNav';
import AdminChallengeManager from '@/components/AdminChallengeManager';
import AdminClassManager from '@/components/AdminClassManager';
import AnalyticsTab from '@/components/admin/AnalyticsTab';
import AnnouncementsTab from '@/components/admin/AnnouncementsTab';
import { 
  Users, Shield, MessageSquare, Plus, Check, X, 
  Loader2, ChevronLeft, Send, Clock, CheckCircle2, AlertCircle, Swords, Calendar,
  BarChart3, Megaphone
} from 'lucide-react';
import { format } from 'date-fns';
import type { AppRole } from '@/types/attendance';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { isTrainer, isLoading: trainerLoading } = useIsTrainer();
  const [activeTab, setActiveTab] = useState('users');

  if (authLoading || adminLoading || trainerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin && !isTrainer) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen pb-24 safe-area-top">
      <header className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? 'Full Access' : 'Staff Access'}
            </p>
          </div>
        </div>
      </header>

      <main className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-2'}`}>
            {isAdmin && (
              <TabsTrigger value="users" className="gap-1 text-[11px] sm:text-xs px-1 sm:px-3">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">Users</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="classes" className="gap-1 text-[11px] sm:text-xs px-1 sm:px-3">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">Classes</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="challenges" className="gap-1 text-[11px] sm:text-xs px-1 sm:px-3">
                <Swords className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden sm:inline truncate">Challenges</span>
                <span className="sm:hidden truncate">Tasks</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="support" className="gap-1 text-[11px] sm:text-xs px-1 sm:px-3">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Support</span>
            </TabsTrigger>
          </TabsList>

          {isAdmin && (
            <TabsContent value="users" className="mt-4">
              <UsersManagement />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="classes" className="mt-4">
              <AdminClassManager />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="challenges" className="mt-4">
              <AdminChallengeManager />
            </TabsContent>
          )}

          <TabsContent value="support" className="mt-4">
            <SupportTicketsManagement />
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}

function UsersManagement() {
  const { data: users, isLoading } = useAdminUsers();
  const approveUser = useApproveUser();
  const assignRole = useAssignRole();
  const createUser = useCreateUser();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', role: 'member' as AppRole });

  const handleCreateUser = async () => {
    await createUser.mutateAsync(newUser);
    setCreateDialogOpen(false);
    setNewUser({ email: '', password: '', name: '', role: 'member' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold">All Users ({users?.length || 0})</h2>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Secure password"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value as AppRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="trainer">Staff/Trainer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateUser}
                disabled={createUser.isPending || !newUser.email || !newUser.password || !newUser.name}
              >
                {createUser.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {users?.map((user) => (
          <Card key={user.user_id}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <Avatar className="w-9 h-9 sm:w-10 sm:h-10 shrink-0">
                  <AvatarImage src={user.avatar_url || ''} />
                  <AvatarFallback className="text-xs">{user.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.name || 'No Name'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.user_id.slice(0, 8)}...</p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {user.role && (
                      <Badge variant={user.role === 'admin' ? 'default' : user.role === 'trainer' ? 'secondary' : 'outline'} className="text-[10px] px-1.5">
                        {user.role}
                      </Badge>
                    )}
                    <Badge variant={user.is_approved ? 'default' : 'destructive'} className="text-[10px] px-1.5">
                      {user.is_approved ? 'Approved' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <Button
                      size="sm"
                      variant={user.is_approved ? 'destructive' : 'default'}
                      className="h-7 text-xs px-2"
                      onClick={() => approveUser.mutate({ userId: user.user_id, approved: !user.is_approved })}
                      disabled={approveUser.isPending}
                    >
                      {user.is_approved ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                    </Button>
                    <Select
                      value={user.role || 'member'}
                      onValueChange={(value) => assignRole.mutate({ userId: user.user_id, role: value as AppRole })}
                    >
                      <SelectTrigger className="w-20 sm:w-24 h-7 text-[10px] sm:text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="trainer">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SupportTicketsManagement() {
  const { data: tickets, isLoading } = useAllTickets();
  const respondToTicket = useRespondToTicket();
  const updateStatus = useUpdateTicketStatus();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [response, setResponse] = useState('');

  const currentTicket = tickets?.find(t => t.id === selectedTicket);

  const handleSendResponse = async () => {
    if (!selectedTicket || !response.trim()) return;
    await respondToTicket.mutateAsync({ ticketId: selectedTicket, message: response });
    setResponse('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Support Tickets ({tickets?.length || 0})</h2>

      {selectedTicket && currentTicket ? (
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
                    From: {currentTicket.user_name} · {format(new Date(currentTicket.created_at), 'MMM d, yyyy')}
                  </CardDescription>
                </div>
                <Select
                  value={currentTicket.status}
                  onValueChange={(value) => updateStatus.mutate({ ticketId: currentTicket.id, status: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">{currentTicket.message}</p>
              </div>

              {currentTicket.responses && currentTicket.responses.length > 0 && (
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
              )}

              <div className="flex gap-2">
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Write your response..."
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendResponse} 
                  disabled={respondToTicket.isPending || !response.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No support tickets yet</p>
            </div>
          ) : (
            tickets?.map((ticket) => (
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
                        {ticket.user_name} · {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground truncate mt-1">{ticket.message}</p>
                    </div>
                    <Badge variant="outline">{ticket.priority}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
