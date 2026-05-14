import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface OwnerOrg {
  id: string;
  name: string;
  gym_code: string | null;
  status: string | null;
}

const ALL_BRANCHES = 'all';
const STORAGE_KEY = 'selected_branch_id';

export function useOwnerOrganizations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['owner-organizations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, gym_code, status')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as OwnerOrg[];
    },
    enabled: !!user?.id,
  });
}

export function getStoredBranch(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredBranch(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {}
}

export { ALL_BRANCHES };
