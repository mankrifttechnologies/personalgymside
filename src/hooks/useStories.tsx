import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useEffect } from 'react';

export function useStories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const storiesQuery = useQuery({
    queryKey: ['gym-stories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gym_stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('stories-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gym_stories' }, () => {
        queryClient.invalidateQueries({ queryKey: ['gym-stories'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const createStory = useMutation({
    mutationFn: async ({ imageUrl, caption, storyType }: { imageUrl: string; caption?: string; storyType?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('gym_stories')
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          caption,
          story_type: storyType || 'checkin',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-stories'] });
      toast.success('Story posted! 📸');
    },
    onError: () => toast.error('Failed to post story'),
  });

  const markViewed = useMutation({
    mutationFn: async (storyId: string) => {
      if (!user) return;
      await supabase
        .from('story_views')
        .insert({ story_id: storyId, viewer_id: user.id })
        .select();
    },
  });

  const deleteStory = useMutation({
    mutationFn: async (storyId: string) => {
      const { error } = await supabase
        .from('gym_stories')
        .delete()
        .eq('id', storyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-stories'] });
      toast.success('Story deleted');
    },
  });

  // Group stories by user
  const storiesByUser = (storiesQuery.data || []).reduce((acc: Record<string, any[]>, story) => {
    if (!acc[story.user_id]) acc[story.user_id] = [];
    acc[story.user_id].push(story);
    return acc;
  }, {});

  return {
    stories: storiesQuery.data || [],
    storiesByUser,
    isLoading: storiesQuery.isLoading,
    createStory,
    markViewed,
    deleteStory,
  };
}
