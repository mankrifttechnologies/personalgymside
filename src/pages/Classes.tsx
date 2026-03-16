import { useState } from 'react';
import { useGymClasses, useClassBookings, useBookingCounts } from '@/hooks/useClassBookings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BottomNav from '@/components/BottomNav';
import { ArrowLeft, Calendar, Clock, MapPin, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, addDays } from 'date-fns';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CLASS_COLORS: Record<string, string> = {
  yoga: 'bg-accent/20 text-accent',
  hiit: 'bg-destructive/20 text-destructive',
  spinning: 'bg-primary/20 text-primary',
  pilates: 'bg-purple-500/20 text-purple-400',
  boxing: 'bg-warning/20 text-warning',
  group: 'bg-blue-500/20 text-blue-400',
};

export default function Classes() {
  const { data: classes, isLoading } = useGymClasses();
  const { bookings, bookClass, cancelBooking } = useClassBookings();
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  const bookingDate = (() => {
    const today = new Date();
    const diff = selectedDay - today.getDay();
    const target = addDays(today, diff >= 0 ? diff : diff + 7);
    return format(target, 'yyyy-MM-dd');
  })();

  const { data: bookingCounts = {} } = useBookingCounts(bookingDate);

  const todayClasses = (classes || []).filter(c => c.day_of_week === selectedDay);

  const isBooked = (classId: string) => {
    return bookings.some((b: any) => b.class_id === classId && b.booking_date === bookingDate);
  };

  const getBookingId = (classId: string) => {
    const booking = bookings.find((b: any) => b.class_id === classId && b.booking_date === bookingDate);
    return booking?.id;
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="p-4 flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Class Schedule</h1>
          <p className="text-sm text-muted-foreground">Book your spot in group sessions</p>
        </div>
      </header>

      <main className="px-4 space-y-4">
        {/* Day selector */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          {DAYS.map((day, i) => (
            <Button
              key={day}
              variant={selectedDay === i ? 'default' : 'outline'}
              size="sm"
              className="shrink-0 text-xs sm:text-sm px-2.5 sm:px-3 h-8 sm:h-9"
              onClick={() => setSelectedDay(i)}
            >
              {day.slice(0, 3)}
            </Button>
          ))}
        </div>

        <Tabs defaultValue="schedule">
          <TabsList className="w-full">
            <TabsTrigger value="schedule" className="flex-1">Schedule</TabsTrigger>
            <TabsTrigger value="bookings" className="flex-1">My Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-3 mt-4">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading classes...</div>
            ) : todayClasses.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No classes scheduled for {DAYS[selectedDay]}
              </div>
            ) : (
              todayClasses.map((cls: any) => {
                const booked = bookingCounts[cls.id] || 0;
                const isFull = booked >= cls.capacity;
                const spotsLeft = cls.capacity - booked;

                return (
                <Card key={cls.id} className={`glass border-border ${isFull ? 'opacity-75' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{cls.title}</h3>
                          {isFull && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">FULL</Badge>
                          )}
                        </div>
                        <Badge className={CLASS_COLORS[cls.class_type] || CLASS_COLORS.group}>
                          {cls.class_type}
                        </Badge>
                      </div>
                      {isBooked(cls.id) ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const id = getBookingId(cls.id);
                            if (id) cancelBooking.mutate(id);
                          }}
                        >
                          <X className="w-4 h-4 mr-1" /> Cancel
                        </Button>
                      ) : (
                        <Button 
                          variant="energy" 
                          size="sm"
                          onClick={() => bookClass.mutate({ classId: cls.id, bookingDate })}
                          disabled={bookClass.isPending || isFull}
                        >
                          {isFull ? 'Full' : 'Book Spot'}
                        </Button>
                      )}
                    </div>
                    {cls.description && (
                      <p className="text-sm text-muted-foreground mb-2">{cls.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {cls.start_time?.slice(0, 5)} - {cls.end_time?.slice(0, 5)}
                      </span>
                      <span className={`flex items-center gap-1 ${isFull ? 'text-destructive font-medium' : spotsLeft <= 3 ? 'text-warning font-medium' : ''}`}>
                        <Users className="w-4 h-4" />
                        {booked}/{cls.capacity} booked
                        {!isFull && spotsLeft <= 3 && ` · ${spotsLeft} left!`}
                      </span>
                      {cls.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {cls.location}
                        </span>
                      )}
                    </div>
                    {/* Capacity bar */}
                    <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${isFull ? 'bg-destructive' : spotsLeft <= 3 ? 'bg-warning' : 'bg-accent'}`}
                        style={{ width: `${Math.min((booked / cls.capacity) * 100, 100)}%` }}
                      />
                    </div>
                    {cls.instructor_name && (
                      <p className="text-sm mt-2">Instructor: <span className="font-medium">{cls.instructor_name}</span></p>
                    )}
                  </CardContent>
                </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-3 mt-4">
            {bookings.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No upcoming bookings
              </div>
            ) : (
              bookings.map((booking: any) => (
                <Card key={booking.id} className="glass border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold">{booking.gym_classes?.title || 'Class'}</h3>
                        <div className="flex gap-2 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(booking.booking_date), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {booking.gym_classes?.start_time?.slice(0, 5)}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive"
                        onClick={() => cancelBooking.mutate(booking.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
