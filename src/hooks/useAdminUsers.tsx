import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserRole } from './useUserRole';

export interface AdminUser {
  user_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  is_approved: boolean;
  role: 'admin' | 'trainer' | 'member' | 'owner' | null;
  created_at: string;
}

export function useAdminUsers() {
  const { data: role } = useUserRole();

  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<AdminUser[]> => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url, is_approved, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get all roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      // Build user list (email not available from profiles, use user_id as fallback)
      return (profiles || []).map(profile => ({
        user_id: profile.user_id,
        email: profile.user_id, // We'll show user_id since email isn't in profiles
        name: profile.name,
        avatar_url: profile.avatar_url,
        is_approved: profile.is_approved || false,
        role: roleMap.get(profile.user_id) as 'admin' | 'trainer' | 'member' | 'owner' | null || null,
        created_at: profile.created_at || '',
      }));
    },
    enabled: role === 'admin' || role === 'owner'
  });
}

export function useApproveUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, approved }: { userId: string; approved: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: approved })
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(approved ? 'User approved for feed access' : 'User access revoked');
    },
    onError: (error) => {
      toast.error('Failed to update user: ' + error.message);
    }
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      name, 
      role,
      organizationId
    }: { 
      email: string; 
      password: string; 
      name: string;
      role: 'admin' | 'trainer' | 'member' | 'owner';
      organizationId?: string;
    }) => {
      // Create user via edge function (admin create user)
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { email, password, name, role, organizationId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create user: ' + error.message);
    }
  });
}
