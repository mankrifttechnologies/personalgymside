import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  photo_date: string;
  pose_type: string;
  weight_kg: number | null;
  notes: string | null;
  ai_analysis: any;
  created_at: string;
}

const BUCKET = 'progress-photos';

async function getSignedUrl(path: string) {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl || '';
}

export function useProgressPhotos() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const photosQuery = useQuery({
    queryKey: ['progress-photos', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('photo_date', { ascending: false });
      if (error) throw error;
      // Generate signed URLs
      const withUrls = await Promise.all(
        (data as ProgressPhoto[]).map(async (p) => ({
          ...p,
          photo_url: p.photo_url.startsWith('http') ? p.photo_url : await getSignedUrl(p.photo_url),
          _path: p.photo_url,
        }))
      );
      return withUrls;
    },
    enabled: !!user?.id,
  });

  const uploadPhoto = useMutation({
    mutationFn: async ({ file, pose, weight, notes, date }: {
      file: File; pose: string; weight: number | null; notes: string; date: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data, error } = await supabase
        .from('progress_photos')
        .insert({ user_id: user.id, photo_url: path, pose_type: pose, weight_kg: weight, notes, photo_date: date })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress-photos', user?.id] });
      toast.success('Photo added');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deletePhoto = useMutation({
    mutationFn: async (photo: ProgressPhoto & { _path?: string }) => {
      if (photo._path) await supabase.storage.from(BUCKET).remove([photo._path]);
      const { error } = await supabase.from('progress_photos').delete().eq('id', photo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress-photos', user?.id] });
      toast.success('Photo deleted');
    },
  });

  const analyzePhoto = useMutation({
    mutationFn: async (photo: ProgressPhoto) => {
      const { data, error } = await supabase.functions.invoke('analyze-progress-photo', {
        body: { mode: 'analyze', imageUrl: photo.photo_url },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const result = data.result;
      const { error: upErr } = await supabase
        .from('progress_photos')
        .update({ ai_analysis: result })
        .eq('id', photo.id);
      if (upErr) throw upErr;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress-photos', user?.id] });
      toast.success('AI analysis complete');
    },
    onError: (e: any) => toast.error(e.message || 'Analysis failed'),
  });

  const comparePhotos = useMutation({
    mutationFn: async ({ before, after }: { before: ProgressPhoto; after: ProgressPhoto }) => {
      const { data, error } = await supabase.functions.invoke('analyze-progress-photo', {
        body: {
          mode: 'compare',
          beforeUrl: before.photo_url,
          afterUrl: after.photo_url,
          beforeWeight: before.weight_kg,
          afterWeight: after.weight_kg,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const result = data.result;
      if (user?.id) {
        await supabase.from('progress_comparisons').insert({
          user_id: user.id,
          before_photo_id: before.id,
          after_photo_id: after.id,
          ai_summary: result.overall_summary,
          ai_changes: result,
        });
      }
      return result;
    },
    onError: (e: any) => toast.error(e.message || 'Comparison failed'),
  });

  return {
    photos: photosQuery.data || [],
    isLoading: photosQuery.isLoading,
    uploadPhoto,
    deletePhoto,
    analyzePhoto,
    comparePhotos,
  };
}
