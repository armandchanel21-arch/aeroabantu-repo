import React, { useState, useRef } from 'react';

interface SOSButtonProps {
  onTrigger: () => void;
}

const SOSButton: React.FC<SOSButtonProps> = ({ onTrigger }) => {
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastVibrationRef = useRef<number>(0);

  const startPress = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsPressing(true);
    setProgress(0);
    const startTime = Date.now();
    const duration = 1500; // 1.5s hold to confirm

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const newProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(newProgress);

      // Haptic feedback during hold
      const vibrationInterval = Math.max(50, 200 - (newProgress * 1.5));
      if (now - lastVibrationRef.current > vibrationInterval) {
        if (window.navigator.vibrate) {
          const pulseDuration = 5 + (newProgress / 10);
          window.navigator.vibrate(pulseDuration);
        }
        lastVibrationRef.current = now;
      }

      if (elapsed >= duration) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (window.navigator.vibrate) {
          window.navigator.vibrate([100, 50, 100]);
        }
        onTrigger();
        setIsPressing(false);
        setProgress(0);
      }
    }, 16);
  };

  const endPress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPressing(false);
    setProgress(0);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`
        text-[10px] font-black uppercase tracking-widest transition-all duration-300
        ${isPressing ? 'text-emergency scale-110 opacity-100' : 'text-muted-foreground opacity-60'}
      `}>
        {isPressing ? 'Release to Cancel' : 'Hold to Alert'}
      </div>
      
      <div className="relative">
        {/* Outer Glow Ring */}
        <div 
          className={`absolute inset-[-8px] rounded-full transition-all duration-300 blur-md opacity-0 bg-emergency
            ${isPressing ? 'opacity-40 scale-110' : ''}
          `}
          style={{ transform: `scale(${1 + (progress / 500)})` }}
        />

        <button
          onMouseDown={startPress}
          onMouseUp={endPress}
          onMouseLeave={endPress}
          onTouchStart={startPress}
          onTouchEnd={endPress}
          className={`
            relative w-24 h-24 rounded-full flex items-center justify-center 
            shadow-2xl transition-all duration-150 overflow-hidden select-none bg-emergency
            ${isPressing ? 'scale-110 ring-4 ring-emergency/30' : 'active:scale-95 animate-sos-glow'}
          `}
          style={{ 
            WebkitTapHighlightColor: 'transparent',
            transform: isPressing ? `scale(${1.1 + (progress / 1000)})` : 'scale(1)'
          }}
        >
          {/* Progress Ring */}
          <div 
            className="absolute inset-0 opacity-40 transition-opacity duration-300"
            style={{ 
              background: `conic-gradient(white ${progress}%, transparent 0)`,
              mixBlendMode: 'overlay'
            }}
          />
          
          {/* Inner progress stroke */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
            <circle
              cx="48"
              cy="48"
              r="44"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeDasharray="276.46"
              strokeDashoffset={276.46 - (276.46 * progress) / 100}
              strokeLinecap="round"
              className="opacity-90"
              style={{ transition: 'stroke-dashoffset 16ms linear' }}
            />
          </svg>
          
          <div className="relative flex flex-col items-center">
            <span className="text-emergency-foreground font-black text-3xl tracking-tighter leading-none">SOS</span>
            {isPressing && (
              <span className="text-emergency-foreground/80 text-[10px] font-bold mt-1">
                {Math.ceil(progress)}%
              </span>
            )}
          </div>
          
          {/* Pulsing decoration when idle */}
          {!isPressing && (
            <div className="absolute inset-0 rounded-full border-4 border-emergency/40 animate-ping opacity-20" />
          )}
        </button>
      </div>
    </div>
  );
};

export default SOSButton;
