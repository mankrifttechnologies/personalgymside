import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, Users, IndianRupee, CalendarCheck, Loader2 } from 'lucide-react';

interface Props {
  organizationId?: string;
}

function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function ReportsExport({ organizationId }: Props) {
  const [exporting, setExporting] = useState<string | null>(null);

  const exportMembers = async () => {
    setExporting('members');
    try {
      const { data: orgMembers } = await supabase
        .from('organization_members')
        .select('user_id, role, status, joined_at')
        .eq('organization_id', organizationId!);

      if (!orgMembers?.length) { toast.info('No members to export'); setExporting(null); return; }

      const userIds = orgMembers.map(m => m.user_id);
      const { data: profiles } = await supabase.from('profiles').select('user_id, name').in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      const rows = [['Name', 'Role', 'Status', 'Joined Date']];
      orgMembers.forEach(m => {
        rows.push([
          profileMap.get(m.user_id) || 'Unknown',
          m.role,
          m.status,
          new Date(m.joined_at).toLocaleDateString(),
        ]);
      });

      downloadCSV(`members_${new Date().toISOString().split('T')[0]}.csv`, rows.map(r => r.join(',')).join('\n'));
      toast.success('Members exported!');
    } catch (err: any) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setExporting(null);
    }
  };

  const exportPayments = async () => {
    setExporting('payments');
    try {
      const { data: orgMembers } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', organizationId!);

      if (!orgMembers?.length) { toast.info('No data to export'); setExporting(null); return; }

      const userIds = orgMembers.map(m => m.user_id);
      const { data: gymMembers } = await supabase.from('gym_members').select('id, user_id').in('user_id', userIds);
      const memberIds = gymMembers?.map(m => m.id) || [];

      const { data: profiles } = await supabase.from('profiles').select('user_id, name').in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);
      const gymToUser = new Map(gymMembers?.map(m => [m.id, m.user_id]) || []);

      const { data: payments } = await supabase
        .from('payment_records')
        .select('*')
        .in('member_id', memberIds)
        .order('payment_date', { ascending: false });

      const rows = [['Member', 'Amount', 'Method', 'Status', 'Date', 'Notes']];
      payments?.forEach(p => {
        const uid = gymToUser.get(p.member_id);
        rows.push([
          uid ? (profileMap.get(uid) || 'Unknown') : 'Unknown',
          p.amount.toString(),
          p.payment_method || '',
          p.status,
          p.payment_date,
          (p.notes || '').replace(/,/g, ';'),
        ]);
      });

      downloadCSV(`payments_${new Date().toISOString().split('T')[0]}.csv`, rows.map(r => r.join(',')).join('\n'));
      toast.success('Payments exported!');
    } catch (err: any) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setExporting(null);
    }
  };

  const exportAttendance = async () => {
    setExporting('attendance');
    try {
      const { data: orgMembers } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', organizationId!);

      if (!orgMembers?.length) { toast.info('No data to export'); setExporting(null); return; }

      const userIds = orgMembers.map(m => m.user_id);
      const { data: gymMembers } = await supabase.from('gym_members').select('id, user_id').in('user_id', userIds);
      const memberIds = gymMembers?.map(m => m.id) || [];

      const { data: profiles } = await supabase.from('profiles').select('user_id, name').in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);
      const gymToUser = new Map(gymMembers?.map(m => [m.id, m.user_id]) || []);

      const { data: logs } = await supabase
        .from('attendance_logs')
        .select('*')
        .in('member_id', memberIds)
        .order('check_in_time', { ascending: false })
        .limit(500);

      const rows = [['Member', 'Check In', 'Check Out', 'Duration (min)', 'Status']];
      logs?.forEach(l => {
        const uid = gymToUser.get(l.member_id);
        rows.push([
          uid ? (profileMap.get(uid) || 'Unknown') : 'Unknown',
          new Date(l.check_in_time).toLocaleString(),
          l.check_out_time ? new Date(l.check_out_time).toLocaleString() : '',
          l.duration_minutes?.toString() || '',
          l.status,
        ]);
      });

      downloadCSV(`attendance_${new Date().toISOString().split('T')[0]}.csv`, rows.map(r => r.join(',')).join('\n'));
      toast.success('Attendance exported!');
    } catch (err: any) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setExporting(null);
    }
  };

  if (!organizationId) return null;

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg flex items-center gap-2">
        <FileSpreadsheet className="w-5 h-5 text-primary" />
        Reports & Export
      </h2>

      <div className="grid gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Members List</p>
              <p className="text-xs text-muted-foreground">Name, role, status, join date</p>
            </div>
            <Button size="sm" variant="outline" onClick={exportMembers} disabled={!!exporting}>
              {exporting === 'members' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-500/15">
              <IndianRupee className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Payment Records</p>
              <p className="text-xs text-muted-foreground">Member, amount, method, status</p>
            </div>
            <Button size="sm" variant="outline" onClick={exportPayments} disabled={!!exporting}>
              {exporting === 'payments' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/15">
              <CalendarCheck className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Attendance Logs</p>
              <p className="text-xs text-muted-foreground">Check-in/out times, duration</p>
            </div>
            <Button size="sm" variant="outline" onClick={exportAttendance} disabled={!!exporting}>
              {exporting === 'attendance' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
