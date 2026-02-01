import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import AeroIcon from '@/components/aero/AeroIcon';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checking, setChecking] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsValidSession(!!session);
      setChecking(false);
    };

    checkSession();

    // Listen for auth state changes (when user clicks recovery link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
        setChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been reset successfully.",
      });

      // Sign out and redirect to login
      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 space-y-6">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="bg-primary w-full h-full rounded-[1.5rem] flex items-center justify-center shadow-2xl border border-border">
            <AeroIcon className="w-14 h-14 text-primary-foreground" />
          </div>
        </div>
        
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-foreground">Invalid or Expired Link</h1>
          <p className="text-muted-foreground max-w-sm">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
        </div>

        <Button
          onClick={() => navigate('/')}
          className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold"
        >
          Back to Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <div className="absolute inset-0 bg-emergency/10 rounded-full blur-3xl animate-pulse" />
          <div className="bg-primary w-full h-full rounded-[2rem] flex items-center justify-center shadow-2xl transform hover:rotate-3 transition-transform duration-500 border border-border">
            <AeroIcon className="w-20 h-20 text-primary-foreground" />
          </div>
        </div>
        
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-black text-foreground tracking-[0.15em] uppercase leading-none">
            AERO<span className="text-emergency">ABANTU</span>
          </h1>
          <div className="h-1 w-10 bg-emergency mx-auto rounded-full" />
          <p className="text-muted-foreground font-medium text-sm">
            Set your new password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-12 rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-xl hover:opacity-90 transition-all"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>Updating...</span>
              </div>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>
      </div>

      <div className="p-8 text-center">
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">
          Secured by Aero Guardian v2.5
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
