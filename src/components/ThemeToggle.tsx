import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={toggleTheme}
      className="relative"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-primary transition-all" />
      ) : (
        <Moon className="w-5 h-5 text-primary transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
