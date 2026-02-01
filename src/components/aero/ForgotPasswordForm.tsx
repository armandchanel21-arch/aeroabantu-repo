import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import AeroIcon from './AeroIcon';
import { ArrowLeft } from 'lucide-react';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
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
            {emailSent ? 'Check your inbox' : 'Reset your password'}
          </p>
        </div>

        {emailSent ? (
          <div className="w-full max-w-sm space-y-6 text-center">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="w-16 h-16 bg-emergency/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emergency" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-foreground font-medium">
                We sent a reset link to:
              </p>
              <p className="text-emergency font-semibold break-all">
                {email}
              </p>
              <p className="text-muted-foreground text-sm">
                Click the link in your email to reset your password. The link expires in 1 hour.
              </p>
            </div>

            <button
              onClick={onBack}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </button>
          </div>
        ) : (
          <>
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
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-xl hover:opacity-90 transition-all"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>

            <button
              onClick={onBack}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </button>
          </>
        )}
      </div>

      <div className="p-8 text-center">
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">
          Secured by Aero Guardian v2.5
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
