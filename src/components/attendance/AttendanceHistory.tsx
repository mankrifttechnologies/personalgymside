import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CalendarDays, 
  Clock, 
  LogIn, 
  LogOut,
  Timer,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useGymMember, useAttendanceLogs } from '@/hooks/useAttendance';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export function AttendanceHistory() {
  const [month, setMonth] = useState(new Date());
  const { data: member } = useGymMember();
  
  const dateRange = {
    start: startOfMonth(month).toISOString(),
    end: endOfMonth(month).toISOString()
  };
  
  const { data: logs, isLoading } = useAttendanceLogs(member?.id, dateRange);

  // Get dates with attendance for calendar
  const attendanceDates = logs?.map(log => new Date(log.check_in_time)) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_out':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'checked_in':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'auto_checkout':
        return <Badge variant="outline">Auto Checkout</Badge>;
      default:
        return <Badge variant="destructive">Missed</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Attendance History
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setMonth(subMonths(month, 1))}
            >
              Previous
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  {format(month, 'MMMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={month}
                  onSelect={(date) => date && setMonth(date)}
                  modifiers={{
                    attended: attendanceDates
                  }}
                  modifiersStyles={{
                    attended: { 
                      backgroundColor: 'hsl(var(--primary))', 
                      color: 'white',
                      borderRadius: '50%'
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{logs?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Total Days</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">
              {logs?.filter(l => l.is_on_time).length || 0}
            </p>
            <p className="text-xs text-muted-foreground">On Time</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">
              {logs?.filter(l => l.status === 'checked_out').length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">
              {logs?.reduce((acc, l) => acc + (l.duration_minutes || 0), 0) || 0}
            </p>
            <p className="text-xs text-muted-foreground">Total Mins</p>
          </div>
        </div>

        {/* Attendance Table */}
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>On Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : logs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No attendance records for this month
                  </TableCell>
                </TableRow>
              ) : (
                logs?.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {format(new Date(log.check_in_time), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <LogIn className="h-4 w-4 text-green-500" />
                        {format(new Date(log.check_in_time), 'h:mm a')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.check_out_time ? (
                        <div className="flex items-center gap-1">
                          <LogOut className="h-4 w-4 text-red-500" />
                          {format(new Date(log.check_out_time), 'h:mm a')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.duration_minutes ? (
                        <div className="flex items-center gap-1">
                          <Timer className="h-4 w-4" />
                          {log.duration_minutes} min
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.is_on_time ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-orange-500" />
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
