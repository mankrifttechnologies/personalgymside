import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useGymClasses() {
  return useQuery({
    queryKey: ['gym-classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gym_classes')
        .select('*')
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time');
      if (error) throw error;
      return data;
    },
  });
}

export function useClassBookings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const bookingsQuery = useQuery({
    queryKey: ['class-bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('class_bookings')
        .select('*, gym_classes(*)')
        .eq('user_id', user.id)
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .order('booking_date');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const bookClass = useMutation({
    mutationFn: async ({ classId, bookingDate }: { classId: string; bookingDate: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('class_bookings')
        .insert({ class_id: classId, user_id: user.id, booking_date: bookingDate })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-bookings'] });
      toast.success('Class booked successfully! 🎉');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('You already booked this class');
      } else {
        toast.error('Failed to book class');
      }
    },
  });

  const cancelBooking = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('class_bookings')
        .delete()
        .eq('id', bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-bookings'] });
      toast.success('Booking cancelled');
    },
    onError: () => toast.error('Failed to cancel booking'),
  });

  return {
    bookings: bookingsQuery.data || [],
    isLoading: bookingsQuery.isLoading,
    bookClass,
    cancelBooking,
  };
}
