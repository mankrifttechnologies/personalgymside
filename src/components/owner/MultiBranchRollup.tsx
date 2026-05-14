import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOwnerOrganizations } from '@/hooks/useOwnerOrganizations';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, IndianRupee, Activity, Loader2 } from 'lucide-react';

interface BranchStats {
  org_id: string;
  org_name: string;
  members: number;
  monthly_revenue: number;
  monthly_checkins: number;
}

export default function MultiBranchRollup() {
  const { data: orgs } = useOwnerOrganizations();

  const { data: stats, isLoading } = useQuery<BranchStats[]>({
    queryKey: ['branch-rollup', orgs?.map(o => o.id).join(',')],
    queryFn: async () => {
      if (!orgs?.length) return [];
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const isoStart = startOfMonth.toISOString();

      const results: BranchStats[] = await Promise.all(
        orgs.map(async (org) => {
          // members
          const { count: memberCount } = await supabase
            .from('gym_members')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', org.id);

          // members for filtering payments / attendance
          const { data: gms } = await supabase
            .from('gym_members')
            .select('id')
            .eq('organization_id', org.id);
          const memberIds = (gms || []).map(g => g.id);

          let revenue = 0;
          let checkins = 0;
          if (memberIds.length) {
            const { data: pays } = await supabase
              .from('payment_records')
              .select('amount, status, payment_date')
              .in('member_id', memberIds)
              .gte('payment_date', isoStart)
              .eq('status', 'paid');
            revenue = (pays || []).reduce((s, p: any) => s + Number(p.amount || 0), 0);

            const { count: ci } = await supabase
              .from('attendance_logs')
              .select('id', { count: 'exact', head: true })
              .in('member_id', memberIds)
              .gte('check_in_time', isoStart);
            checkins = ci || 0;
          }

          return {
            org_id: org.id,
            org_name: org.name,
            members: memberCount || 0,
            monthly_revenue: revenue,
            monthly_checkins: checkins,
          };
        })
      );
      return results;
    },
    enabled: !!orgs?.length,
  });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const totals = (stats || []).reduce(
    (acc, s) => ({
      members: acc.members + s.members,
      revenue: acc.revenue + s.monthly_revenue,
      checkins: acc.checkins + s.monthly_checkins,
    }),
    { members: 0, revenue: 0, checkins: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center">
          <Users className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="text-lg font-bold">{totals.members}</p>
          <p className="text-[10px] text-muted-foreground">Total Members</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <IndianRupee className="w-5 h-5 mx-auto text-green-500 mb-1" />
          <p className="text-lg font-bold">₹{totals.revenue.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Month Revenue</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Activity className="w-5 h-5 mx-auto text-blue-500 mb-1" />
          <p className="text-lg font-bold">{totals.checkins}</p>
          <p className="text-[10px] text-muted-foreground">Check-ins (mo)</p>
        </CardContent></Card>
      </div>

      <h3 className="text-sm font-semibold mt-4">Branches</h3>
      <div className="space-y-2">
        {(stats || []).map(s => (
          <Card key={s.org_id}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Building2 className="w-4 h-4 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{s.org_name}</p>
                <p className="text-xs text-muted-foreground">{s.members} members • {s.monthly_checkins} check-ins this month</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">₹{s.monthly_revenue.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">this month</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
