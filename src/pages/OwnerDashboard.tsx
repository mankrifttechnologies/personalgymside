import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useCreateUser } from '@/hooks/useAdminUsers';
import { useOrgMembers, useRemoveOrgMember, useUpdateOrgMemberRole } from '@/hooks/useOrgMembers';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import BulkMemberUpload from '@/components/BulkMemberUpload';
import OwnerAnalyticsDashboard from '@/components/admin/OwnerAnalyticsDashboard';
import RevenueDashboard from '@/components/admin/RevenueDashboard';
import EditableOrgSettings from '@/components/owner/EditableOrgSettings';
import MemberActivityView from '@/components/owner/MemberActivityView';
import OrgAnnouncements from '@/components/owner/OrgAnnouncements';
import MemberPaymentRecording from '@/components/owner/MemberPaymentRecording';
import {
  Building2, Users, BarChart3, Upload, Settings,
  LogOut, Loader2, Plus, IndianRupee, UserMinus, Activity, Megaphone, CreditCard
} from 'lucide-react';
import type { AppRole } from '@/types/attendance';

export default function OwnerDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: organization } = useQuery({
    queryKey: ['owner-organization', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (role !== 'owner' && role !== 'admin') return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen safe-area-top bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/15">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{organization?.name || 'My Gym'}</h1>
              <p className="text-xs text-muted-foreground">Owner Dashboard</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => signOut()}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 h-auto gap-1">
            <TabsTrigger value="overview" className="gap-1.5 text-xs py-2.5">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-1.5 text-xs py-2.5">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Members</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5 text-xs py-2.5">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-1.5 text-xs py-2.5">
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">News</span>
            </TabsTrigger>
            <TabsTrigger value="bulk-upload" className="gap-1.5 text-xs py-2.5">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Bulk Add</span>
            </TabsTrigger>
            <TabsTrigger value="revenue" className="gap-1.5 text-xs py-2.5">
              <IndianRupee className="w-4 h-4" />
              <span className="hidden sm:inline">Revenue</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 text-xs py-2.5">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <OwnerAnalyticsDashboard organizationId={organization?.id} />
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            <MembersTab organizationId={organization?.id} />
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <MemberActivityView organizationId={organization?.id} />
          </TabsContent>

          <TabsContent value="announcements" className="mt-4">
            <OrgAnnouncements />
          </TabsContent>

          <TabsContent value="bulk-upload" className="mt-4">
            <BulkMemberUpload />
          </TabsContent>

          <TabsContent value="revenue" className="mt-4">
            <RevenueDashboard />
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <EditableOrgSettings
              organization={organization}
              onUpdate={() => queryClient.invalidateQueries({ queryKey: ['owner-organization'] })}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function MembersTab({ organizationId }: { organizationId: string | undefined }) {
  const { data: members, isLoading } = useOrgMembers(organizationId);
  const removeOrgMember = useRemoveOrgMember();
  const updateRole = useUpdateOrgMemberRole();
  const createUser = useCreateUser();
  const [createOpen, setCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', role: 'member' as AppRole });

  const handleCreate = async () => {
    await createUser.mutateAsync({ ...newUser, organizationId });
    setCreateOpen(false);
    setNewUser({ email: '', password: '', name: '', role: 'member' });
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg">Members ({members?.length || 0})</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Member</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="Temporary password" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newUser.role} onValueChange={v => setNewUser({ ...newUser, role: v as AppRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="trainer">Trainer/Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={createUser.isPending || !newUser.email || !newUser.password || !newUser.name}>
                {createUser.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Member
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {members?.map(member => (
          <Card key={member.org_member_id}>
            <CardContent className="p-4 flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={member.avatar_url || ''} />
                <AvatarFallback>{member.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{member.name || 'No Name'}</p>
                <div className="flex gap-1.5 mt-1">
                  <Badge variant={member.role === 'trainer' ? 'secondary' : 'outline'} className="text-[10px]">
                    {member.role}
                  </Badge>
                  <Badge variant={member.status === 'active' ? 'default' : 'destructive'} className="text-[10px]">
                    {member.status}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 w-8 p-0"
                  onClick={() => removeOrgMember.mutate({ orgMemberId: member.org_member_id })}
                >
                  <UserMinus className="w-3.5 h-3.5" />
                </Button>
                <Select value={member.role} onValueChange={v => updateRole.mutate({ orgMemberId: member.org_member_id, role: v })}>
                  <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="trainer">Trainer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!members || members.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No members yet</p>
              <p className="text-sm mt-1">Add members manually or use Bulk Upload</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
