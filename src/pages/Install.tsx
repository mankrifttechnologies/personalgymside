import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dumbbell, Download, Share, ChevronLeft, Smartphone, CheckCircle2, Zap, Shield, Wifi } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Zap, label: 'Lightning fast', desc: 'Opens instantly from your home screen' },
    { icon: Wifi, label: 'Works offline', desc: 'Log workouts without internet' },
    { icon: Shield, label: 'Always updated', desc: 'Automatically stays up-to-date' },
    { icon: Smartphone, label: 'Native feel', desc: 'Full-screen app experience' },
  ];

  return (
    <div className="min-h-screen pb-12 safe-area-top">
      <header className="p-4 flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Install App</h1>
      </header>

      <main className="px-4 space-y-6">
        {/* Hero */}
        <div className="text-center py-8 animate-slide-up">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Dumbbell className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">FitAI Coach</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Install FitAI Coach on your device for the best experience
          </p>
        </div>

        {/* Status */}
        {isInstalled ? (
          <div className="glass rounded-xl p-6 text-center animate-slide-up">
            <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-1">Already Installed!</h3>
            <p className="text-sm text-muted-foreground">
              FitAI Coach is installed on your device. Open it from your home screen.
            </p>
          </div>
        ) : isIOS ? (
          <div className="glass rounded-xl p-6 animate-slide-up">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Share className="w-5 h-5 text-primary" />
              Install on iPhone / iPad
            </h3>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</span>
                <span>Tap the <strong>Share</strong> button in Safari's toolbar</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</span>
                <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</span>
                <span>Tap <strong>"Add"</strong> to install</span>
              </li>
            </ol>
          </div>
        ) : deferredPrompt ? (
          <div className="animate-slide-up">
            <Button variant="energy" size="lg" className="w-full gap-2" onClick={handleInstall}>
              <Download className="w-5 h-5" />
              Install FitAI Coach
            </Button>
          </div>
        ) : (
          <div className="glass rounded-xl p-6 animate-slide-up">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Install on Android
            </h3>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</span>
                <span>Open the <strong>browser menu</strong> (three dots)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</span>
                <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></span>
              </li>
            </ol>
          </div>
        )}

        {/* Features */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-semibold">Why install?</h3>
          {features.map((f, i) => (
            <div key={i} className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/20 shrink-0">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}