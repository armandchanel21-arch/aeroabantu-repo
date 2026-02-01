import React from 'react';
import { User } from '@/types/aero';
import AeroIcon from './AeroIcon';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const handleMockLogin = (provider: string) => {
    onLogin({
      id: 'mock-user-' + Math.random().toString(36).substr(2, 5),
      name: 'Aero Member',
      email: provider.toLowerCase() + '@example.com',
      phone: '+27 12 345 6789',
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <div className="absolute inset-0 bg-emergency/10 rounded-full blur-3xl animate-pulse" />
          <div className="bg-primary w-full h-full rounded-[3rem] flex items-center justify-center shadow-2xl transform hover:rotate-3 transition-transform duration-500 border border-border">
            <AeroIcon className="w-32 h-32 text-primary-foreground" />
          </div>
        </div>
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black text-foreground tracking-[0.2em] uppercase leading-none">
            AERO<span className="text-emergency">ABANTU</span>
          </h1>
          <div className="h-1 w-12 bg-emergency mx-auto rounded-full" />
          <p className="text-muted-foreground font-medium px-4 max-w-xs mx-auto leading-relaxed text-sm">
            Advanced AI Aerial Response & Community Protection Network.
          </p>
        </div>

        <div className="w-full max-w-sm space-y-4 pt-4">
          <button 
            onClick={() => handleMockLogin('Google')}
            className="w-full bg-card border border-border flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-foreground shadow-sm active:bg-secondary transition-all hover:border-muted-foreground/30"
          >
            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-6 h-6" alt="Google" />
            Sign in with Google
          </button>
          
          <button 
             onClick={() => handleMockLogin('Apple')}
            className="w-full bg-primary flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-primary-foreground shadow-xl active:opacity-90 transition-all"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2.002-.156-3.753 1.04-4.51 1.04h-.01l.01-.01zM15.193 4.65c.819-.987 1.364-2.364 1.221-3.74-1.17.052-2.585.779-3.43 1.766-.753.87-1.416 2.285-1.234 3.623 1.312.104 2.624-.65 3.443-1.65z" />
            </svg>
            Sign in with Apple
          </button>
        </div>
      </div>

      <div className="p-8 text-center">
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">
          Secured by Aero Guardian v2.5
        </p>
      </div>
    </div>
  );
};

export default Auth;
