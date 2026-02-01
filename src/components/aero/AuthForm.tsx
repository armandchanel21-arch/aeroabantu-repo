import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import AeroIcon from './AeroIcon';
import { Separator } from '@/components/ui/separator';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
        onAuthSuccess();
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords don't match");
        }

        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;
        
        toast({
          title: "Check your email",
          description: "We've sent you a verification link to complete signup.",
        });
      }
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
            {isLogin ? 'Sign in to continue' : 'Create your account'}
          </p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full bg-card border border-border flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-foreground shadow-sm active:bg-secondary transition-all hover:border-muted-foreground/30 disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
            ) : (
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-6 h-6" alt="Google" />
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground font-medium">or</span>
            <Separator className="flex-1" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
            {!isLogin && (
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12 rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground"
              />
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-xl hover:opacity-90 transition-all"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
              </div>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </Button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isLogin ? (
            <>Don't have an account? <span className="text-emergency font-semibold">Sign up</span></>
          ) : (
            <>Already have an account? <span className="text-emergency font-semibold">Sign in</span></>
          )}
        </button>
      </div>

      <div className="p-8 text-center">
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">
          Secured by Aero Guardian v2.5
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
