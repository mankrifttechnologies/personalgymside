import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useMyGymBranding } from '@/hooks/useMyGymBranding';
import { useProfile } from '@/hooks/useProfile';
import { buildWhatsAppShareUrl } from '@/lib/upi';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  variant?: 'inline' | 'floating';
  prefilledMessage?: string;
  className?: string;
}

/**
 * Click-to-chat WhatsApp button. Opens wa.me with the member's gym
 * WhatsApp number and a polite pre-filled greeting.
 */
export default function WhatsAppGymButton({ variant = 'inline', prefilledMessage, className }: Props) {
  const { data: gym } = useMyGymBranding();
  const { profile } = useProfile();

  if (!gym?.whatsapp_number) return null;

  const message =
    prefilledMessage ??
    `Hi! I'm ${profile?.name || 'a member'} from ${gym.gym_name}. `;

  const handleClick = () => {
    const url = buildWhatsAppShareUrl(gym.whatsapp_number, message);
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success('Opening WhatsApp…');
  };

  if (variant === 'floating') {
    return (
      <button
        onClick={handleClick}
        aria-label="Chat with gym on WhatsApp"
        className={cn(
          'fixed bottom-24 right-4 z-40 h-12 w-12 rounded-full shadow-lg',
          'bg-[#25D366] text-white flex items-center justify-center',
          'active:scale-95 transition-transform',
          className,
        )}
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className={cn('gap-2 border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10', className)}
    >
      <MessageCircle className="w-4 h-4" />
      Chat with {gym.gym_name} on WhatsApp
    </Button>
  );
}
