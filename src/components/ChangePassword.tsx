import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Key, Eye, EyeOff, Loader2, Lock, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters' };
    }
    if (!/[A-Za-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true, message: '' };
  };

  const handleChangePassword = async () => {
    // Validate inputs
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      toast.success('Password changed successfully!');
      resetForm();
      setOpen(false);
    } catch (error: any) {
      console.error('Password change error:', error);
      
      if (error.message?.includes('same_password')) {
        toast.error('New password must be different from your current password');
      } else if (error.message?.includes('weak_password')) {
        toast.error('Password is too weak. Please choose a stronger password');
      } else {
        toast.error(error.message || 'Failed to change password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = (password: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 1) return { strength: 1, label: 'Weak', color: 'bg-destructive' };
    if (strength <= 2) return { strength: 2, label: 'Fair', color: 'bg-orange-500' };
    if (strength <= 3) return { strength: 3, label: 'Good', color: 'bg-yellow-500' };
    if (strength <= 4) return { strength: 4, label: 'Strong', color: 'bg-green-500' };
    return { strength: 5, label: 'Very Strong', color: 'bg-green-600' };
  };

  const strength = passwordStrength(newPassword);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <button className="glass rounded-xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform w-full text-left">
          <div className="p-2 rounded-lg bg-orange-500/20">
            <Key className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">Change Password</p>
            <p className="text-xs text-muted-foreground">Update your account security</p>
          </div>
          <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Change Password
          </DialogTitle>
          <DialogDescription>
            Enter a new password for your account. Make sure it's strong and secure.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* New Password */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">New Password</label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= strength.strength ? strength.color : 'bg-secondary'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${strength.color.replace('bg-', 'text-')}`}>
                  Password strength: {strength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Confirm New Password</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive mt-1">Passwords do not match</p>
            )}
            {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Passwords match
              </p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-xs font-medium mb-2">Password requirements:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className={`flex items-center gap-2 ${newPassword.length >= 6 ? 'text-green-500' : ''}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 6 ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                At least 6 characters
              </li>
              <li className={`flex items-center gap-2 ${/[A-Za-z]/.test(newPassword) ? 'text-green-500' : ''}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${/[A-Za-z]/.test(newPassword) ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                Contains a letter
              </li>
              <li className={`flex items-center gap-2 ${/[0-9]/.test(newPassword) ? 'text-green-500' : ''}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                Contains a number
              </li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Change Password'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
