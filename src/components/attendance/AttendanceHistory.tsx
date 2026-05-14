import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CalendarDays,
  LogIn,
  LogOut,
  Timer,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useGymMember, useAttendanceLogs } from '@/hooks/useAttendance';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';

export function AttendanceHistory() {
  const [month, setMonth] = useState(new Date());
  const { data: member } = useGymMember();

  const dateRange = {
    start: startOfMonth(month).toISOString(),
    end: endOfMonth(month).toISOString(),
  };

  const { data: logs, isLoading } = useAttendanceLogs(member?.id, dateRange);
  const attendanceDates = logs?.map(log => new Date(log.check_in_time)) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_out':
        return <Badge className="bg-green-500/15 text-green-500 border-green-500/30 text-[10px] px-1.5 h-5">Done</Badge>;
      case 'checked_in':
        return <Badge variant="secondary" className="text-[10px] px-1.5 h-5">In gym</Badge>;
      case 'auto_checkout':
        return <Badge variant="outline" className="text-[10px] px-1.5 h-5">Auto out</Badge>;
      default:
        return <Badge variant="destructive" className="text-[10px] px-1.5 h-5">Missed</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          Attendance History
        </CardTitle>

        {/* Month switcher — mobile friendly */}
        <div className="flex items-center justify-between mt-2 gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setMonth(subMonths(month, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 font-medium">
                {format(month, 'MMMM yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={month}
                onSelect={(date) => date && setMonth(date)}
                modifiers={{ attended: attendanceDates }}
                modifiersStyles={{
                  attended: {
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'white',
                    borderRadius: '50%',
                  },
                }}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setMonth(addMonths(month, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Summary — 2x2 on mobile, 4-up on larger */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="text-center p-2.5 rounded-lg bg-muted/50">
            <p className="text-lg font-bold leading-tight">{logs?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground">Total Days</p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-muted/50">
            <p className="text-lg font-bold leading-tight">
              {logs?.filter(l => l.is_on_time).length || 0}
            </p>
            <p className="text-[10px] text-muted-foreground">On Time</p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-muted/50">
            <p className="text-lg font-bold leading-tight">
              {logs?.filter(l => l.status === 'checked_out').length || 0}
            </p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-muted/50">
            <p className="text-lg font-bold leading-tight">
              {logs?.reduce((acc, l) => acc + (l.duration_minutes || 0), 0) || 0}
            </p>
            <p className="text-[10px] text-muted-foreground">Total Min</p>
          </div>
        </div>

        {/* Mobile-first list of day cards (replaces desktop-only wide table) */}
        <ScrollArea className="h-[440px] pr-1 -mr-1">
          {isLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading…</div>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
              No attendance records for this month
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <div
                  key={log.id}
                  className="rounded-xl border border-border/40 bg-card/50 p-3"
                >
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <p className="font-semibold text-sm">
                      {format(new Date(log.check_in_time), 'EEE, MMM d')}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {log.is_on_time ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-orange-500" />
                      )}
                      {getStatusBadge(log.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="flex items-center gap-1 min-w-0">
                      <LogIn className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      <span className="truncate">
                        {format(new Date(log.check_in_time), 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                      <LogOut className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <span className="truncate">
                        {log.check_out_time
                          ? format(new Date(log.check_out_time), 'h:mm a')
                          : '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 min-w-0 justify-end">
                      <Timer className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">
                        {log.duration_minutes ? `${log.duration_minutes} min` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
