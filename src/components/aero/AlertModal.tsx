import React, { useEffect, useState } from 'react';
import { AlertTriangle, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface AlertModalProps {
  onClose: () => void;
  shareTokens?: string[];
}

const AlertModal: React.FC<AlertModalProps> = ({ onClose, shareTokens = [] }) => {
  const [countdown, setCountdown] = useState(10);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getShareLink = (token: string) => {
    return `${window.location.origin}/track/${token}`;
  };

  const copyShareLink = async () => {
    if (shareTokens.length === 0) return;
    
    const link = getShareLink(shareTokens[0]);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Tracking link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-emergency flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500 via-red-600 to-red-800 opacity-50" />
      
      <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-sm">
        <div className="w-32 h-32 bg-card rounded-full flex items-center justify-center shadow-2xl animate-pulse">
          <AlertTriangle className="w-20 h-20 text-emergency" />
        </div>

        <div className="space-y-2">
          <h2 className="text-4xl font-black text-emergency-foreground tracking-tighter uppercase leading-none">Emergency Triggered</h2>
          <p className="text-red-100 font-medium">Your circle has been notified and is receiving your live location.</p>
        </div>

        {/* Share link section */}
        {shareTokens.length > 0 && (
          <div className="w-full bg-card/20 backdrop-blur-sm rounded-xl p-4 space-y-3">
            <p className="text-emergency-foreground/90 text-xs font-bold uppercase tracking-wider">
              Share tracking link with others
            </p>
            <div className="flex gap-2">
              <button
                onClick={copyShareLink}
                className="flex-1 flex items-center justify-center gap-2 bg-card text-foreground font-bold py-3 px-4 rounded-xl shadow-lg active:scale-95 transition-transform"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-success" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
              <a
                href={getShareLink(shareTokens[0])}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center bg-card text-foreground font-bold py-3 px-4 rounded-xl shadow-lg active:scale-95 transition-transform"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {countdown > 0 ? (
          <div className="space-y-4 w-full">
            <p className="text-emergency-foreground/80 text-sm font-bold">Alerting services in {countdown}s...</p>
            <button 
              onClick={onClose}
              className="w-full bg-card text-emergency font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-transform"
            >
              CANCEL ALERT (I'M SAFE)
            </button>
          </div>
        ) : (
          <div className="space-y-4 w-full">
             <button 
              onClick={onClose}
              className="w-full bg-primary text-primary-foreground font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-transform"
            >
              DISMISS
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertModal;
