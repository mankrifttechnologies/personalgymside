import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Photo, useLikes } from '@/hooks/usePhotos';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CommentsSheet } from './CommentsSheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

interface PhotoCardProps {
  photo: Photo;
  onDelete?: () => void;
}

export function PhotoCard({ photo, onDelete }: PhotoCardProps) {
  const { user } = useAuth();
  const { toggleLike } = useLikes();
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(photo.is_liked);
  const [likesCount, setLikesCount] = useState(photo.likes_count);

  const isOwner = user?.id === photo.user_id;

  const handleLike = () => {
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);
    toggleLike.mutate({ photoId: photo.id, isLiked });
  };

  return (
    <>
      <div className="glass rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3">
          <Link to={`/member/${photo.user_id}`} className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={photo.user_avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {photo.user_name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{photo.user_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(photo.created_at), { addSuffix: true })}
              </p>
            </div>
          </Link>
          
          {isOwner && onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Photo */}
        <div className="aspect-square bg-muted">
          <img
            src={photo.photo_url}
            alt={photo.caption || 'Photo'}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Actions */}
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 ${isLiked ? 'text-red-500' : ''}`}
              onClick={handleLike}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => setShowComments(true)}
            >
              <MessageCircle className="h-5 w-5" />
              <span>{photo.comments_count}</span>
            </Button>
          </div>

          {/* Caption */}
          {photo.caption && (
            <p className="text-sm">
              <span className="font-semibold mr-2">{photo.user_name}</span>
              {photo.caption}
            </p>
          )}

          {/* View comments link */}
          {photo.comments_count > 0 && (
            <button
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowComments(true)}
            >
              View all {photo.comments_count} comments
            </button>
          )}
        </div>
      </div>

      <CommentsSheet
        photoId={photo.id}
        open={showComments}
        onOpenChange={setShowComments}
      />
    </>
  );
}
