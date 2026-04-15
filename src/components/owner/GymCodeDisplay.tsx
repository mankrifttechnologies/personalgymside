import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  gymCode?: string;
}

export default function GymCodeDisplay({ gymCode }: Props) {
  if (!gymCode) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(gymCode);
    toast.success('Gym code copied!');
  };

  return (
    <Card className="border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/15">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gym Join Code</p>
              <p className="font-mono text-xl font-bold tracking-widest text-primary">{gymCode}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
            <Copy className="w-3.5 h-3.5" /> Copy
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Share this code with members so they can join your gym via the "Join Gym" page.
        </p>
      </CardContent>
    </Card>
  );
}
