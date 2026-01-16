import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useFollows } from './useFollows';
import { toast } from 'sonner';

export interface Photo {
  id: string;
  user_id: string;
  photo_url: string;
  caption: string | null;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export interface Comment {
  id: string;
  photo_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

export function usePhotos() {
  const { user } = useAuth();
  const { following } = useFollows();
  const queryClient = useQueryClient();

  // Fetch feed photos from followed users
  const { data: feedPhotos = [], isLoading: feedLoading } = useQuery({
    queryKey: ['feed-photos', user?.id, following],
    queryFn: async (): Promise<Photo[]> => {
      if (!user?.id) return [];

      const followingIds = following.map(f => f.following_id);
      // Include own photos in feed
      const allIds = [...followingIds, user.id];

      if (allIds.length === 0) return [];

      const { data: photos, error } = await supabase
        .from('user_photos')
        .select('*')
        .in('user_id', allIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get user profiles for photos
      const userIds = [...new Set(photos?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Get likes counts
      const photoIds = photos?.map(p => p.id) || [];
      const { data: likes } = await supabase
        .from('photo_likes')
        .select('photo_id, user_id')
        .in('photo_id', photoIds);

      const likesMap = new Map<string, { count: number; isLiked: boolean }>();
      photoIds.forEach(id => likesMap.set(id, { count: 0, isLiked: false }));
      likes?.forEach(like => {
        const current = likesMap.get(like.photo_id) || { count: 0, isLiked: false };
        likesMap.set(like.photo_id, {
          count: current.count + 1,
          isLiked: current.isLiked || like.user_id === user.id
        });
      });

      // Get comments counts
      const { data: comments } = await supabase
        .from('photo_comments')
        .select('photo_id')
        .in('photo_id', photoIds);

      const commentsMap = new Map<string, number>();
      comments?.forEach(c => {
        commentsMap.set(c.photo_id, (commentsMap.get(c.photo_id) || 0) + 1);
      });

      return (photos || []).map(photo => {
        const profile = profileMap.get(photo.user_id);
        const likeData = likesMap.get(photo.id) || { count: 0, isLiked: false };
        return {
          ...photo,
          user_name: profile?.name || 'Unknown',
          user_avatar: profile?.avatar_url || null,
          likes_count: likeData.count,
          comments_count: commentsMap.get(photo.id) || 0,
          is_liked: likeData.isLiked,
        };
      });
    },
    enabled: !!user?.id,
  });

  // Fetch my photos
  const { data: myPhotos = [], isLoading: myPhotosLoading } = useQuery({
    queryKey: ['my-photos', user?.id],
    queryFn: async (): Promise<Photo[]> => {
      if (!user?.id) return [];

      const { data: photos, error } = await supabase
        .from('user_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get likes/comments counts
      const photoIds = photos?.map(p => p.id) || [];
      
      const { data: likes } = await supabase
        .from('photo_likes')
        .select('photo_id')
        .in('photo_id', photoIds);

      const { data: comments } = await supabase
        .from('photo_comments')
        .select('photo_id')
        .in('photo_id', photoIds);

      const likesMap = new Map<string, number>();
      likes?.forEach(l => likesMap.set(l.photo_id, (likesMap.get(l.photo_id) || 0) + 1));

      const commentsMap = new Map<string, number>();
      comments?.forEach(c => commentsMap.set(c.photo_id, (commentsMap.get(c.photo_id) || 0) + 1));

      return (photos || []).map(photo => ({
        ...photo,
        likes_count: likesMap.get(photo.id) || 0,
        comments_count: commentsMap.get(photo.id) || 0,
        is_liked: false,
      }));
    },
    enabled: !!user?.id,
  });

  // Upload photo
  const uploadPhoto = useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

      // Create photo record
      const { data, error } = await supabase
        .from('user_photos')
        .insert({
          user_id: user.id,
          photo_url: publicUrl,
          caption: caption || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-photos'] });
      queryClient.invalidateQueries({ queryKey: ['feed-photos'] });
      toast.success('Photo uploaded!');
    },
    onError: () => {
      toast.error('Failed to upload photo');
    },
  });

  // Delete photo
  const deletePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_photos')
        .delete()
        .eq('id', photoId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-photos'] });
      queryClient.invalidateQueries({ queryKey: ['feed-photos'] });
      toast.success('Photo deleted');
    },
  });

  // Real-time updates for feed
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('photos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_photos' }, () => {
        queryClient.invalidateQueries({ queryKey: ['feed-photos'] });
        queryClient.invalidateQueries({ queryKey: ['my-photos'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photo_likes' }, () => {
        queryClient.invalidateQueries({ queryKey: ['feed-photos'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photo_comments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['feed-photos'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return {
    feedPhotos,
    myPhotos,
    feedLoading,
    myPhotosLoading,
    uploadPhoto,
    deletePhoto,
  };
}

export function useLikes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const toggleLike = useMutation({
    mutationFn: async ({ photoId, isLiked }: { photoId: string; isLiked: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (isLiked) {
        const { error } = await supabase
          .from('photo_likes')
          .delete()
          .eq('photo_id', photoId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('photo_likes')
          .insert({ photo_id: photoId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-photos'] });
    },
  });

  return { toggleLike };
}

export function useComments(photoId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['photo-comments', photoId],
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from('photo_comments')
        .select('*')
        .eq('photo_id', photoId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get user profiles
      const userIds = [...new Set(data?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (data || []).map(comment => ({
        ...comment,
        user_name: profileMap.get(comment.user_id)?.name || 'Unknown',
        user_avatar: profileMap.get(comment.user_id)?.avatar_url || null,
      }));
    },
    enabled: !!photoId,
  });

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('photo_comments')
        .insert({ photo_id: photoId, user_id: user.id, content })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-comments', photoId] });
      queryClient.invalidateQueries({ queryKey: ['feed-photos'] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('photo_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-comments', photoId] });
      queryClient.invalidateQueries({ queryKey: ['feed-photos'] });
    },
  });

  return { comments, isLoading, addComment, deleteComment };
}
