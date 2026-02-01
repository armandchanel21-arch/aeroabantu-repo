import React, { useState } from 'react';
import { User, AIMessage } from '@/types/aero';
import { Mic, GraduationCap, Info } from 'lucide-react';

interface AISettingsProps {
  isListening: boolean;
  setIsListening: (value: boolean) => void;
  onSOSDetected: () => void;
  user: User | null;
}

const AISettings: React.FC<AISettingsProps> = ({ 
  isListening, 
  setIsListening, 
  onSOSDetected,
  user 
}) => {
  const [isTrainingMode, setIsTrainingMode] = useState(false);
  const [secretPhrase, setSecretPhrase] = useState('Help AeroAbantu');
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);

  const log = (message: string) => {
    setDebugLog(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 20));
  };

  const startListening = async () => {
    log(isTrainingMode ? "Starting training drill..." : "Initializing Guardian AI...");
    
    // Simulate AI listening activation
    setTimeout(() => {
      log(isTrainingMode ? "Training Mode Activated" : "Guardian AI Activated");
      setIsListening(true);
      
      // Simulate a message after a delay
      if (isTrainingMode) {
        setTimeout(() => {
          const newMsg: AIMessage = {
            id: Math.random().toString(36).substr(2, 9),
            text: "Training session active. Try saying your trigger phrase clearly.",
            timestamp: Date.now()
          };
          setAiMessages(prev => [newMsg, ...prev].slice(0, 10));
        }, 2000);
      }
    }, 1500);
  };

  const stopListening = () => {
    setIsListening(false);
    log(isTrainingMode ? "Training stopped" : "Guardian AI stopped");
  };

  const simulateTrigger = () => {
    if (isTrainingMode) {
      log("Training trigger detected!");
      const newMsg: AIMessage = {
        id: Math.random().toString(36).substr(2, 9),
        text: "Great job! Your trigger phrase was recognized. In a real emergency, this would activate the SOS system.",
        timestamp: Date.now()
      };
      setAiMessages(prev => [newMsg, ...prev].slice(0, 10));
    } else {
      log("AI DETECTED EMERGENCY!");
      onSOSDetected();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">AI Protection</h2>
        <div className="flex bg-secondary p-1 rounded-xl border border-border">
          <button 
            onClick={() => !isListening && setIsTrainingMode(false)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${!isTrainingMode ? 'bg-card shadow-sm text-emergency' : 'text-muted-foreground'}`}
            disabled={isListening}
          >
            Guardian
          </button>
          <button 
            onClick={() => !isListening && setIsTrainingMode(true)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${isTrainingMode ? 'bg-card shadow-sm text-training' : 'text-muted-foreground'}`}
            disabled={isListening}
          >
            Training
          </button>
        </div>
      </div>
      
      <div className={`
        border rounded-3xl p-6 text-primary-foreground shadow-2xl relative overflow-hidden transition-all duration-500
        ${isTrainingMode 
          ? 'bg-training border-training/20' 
          : 'bg-primary border-border'}
      `}>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          {isTrainingMode ? (
            <GraduationCap className="w-24 h-24" />
          ) : (
            <Mic className="w-24 h-24" />
          )}
        </div>

        <h3 className="text-xl font-black mb-2">
          {isTrainingMode ? 'Voice Training Drill' : 'Guardian Listener'}
        </h3>
        <p className="text-primary-foreground/70 text-sm mb-6 leading-relaxed">
          {isTrainingMode 
            ? 'Practice your trigger phrase to ensure the AI recognizes your voice perfectly. No real alerts will be sent.'
            : 'The AI stays silent until you trigger it. Once SOS is active, it will provide verbal reassurance and guidance.'}
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/60">Secret Trigger Phrase</label>
            <input 
              value={secretPhrase}
              onChange={(e) => setSecretPhrase(e.target.value)}
              disabled={isListening}
              className={`w-full bg-black/30 border rounded-2xl px-4 py-3 text-sm focus:ring-2 outline-none disabled:opacity-50 transition-colors text-primary-foreground placeholder:text-primary-foreground/50
                ${isTrainingMode ? 'border-training/30 focus:ring-training' : 'border-primary-foreground/20 focus:ring-info'}
              `}
              placeholder="e.g. Help AeroAbantu"
            />
          </div>

          <button 
            onClick={isListening ? stopListening : startListening}
            className={`w-full py-4 rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-2 
              ${isListening 
                ? 'bg-emergency hover:bg-emergency/90 animate-pulse' 
                : isTrainingMode 
                  ? 'bg-training/80 hover:bg-training' 
                  : 'bg-info hover:bg-info/90'
              }`}
          >
            {isListening ? (
              <>
                <div className="w-2 h-2 bg-emergency-foreground rounded-full" />
                {isTrainingMode ? 'END DRILL' : 'GUARDIAN ACTIVE'}
              </>
            ) : (
              isTrainingMode ? 'START TRAINING' : 'ACTIVATE GUARDIAN'
            )}
          </button>

          {isListening && (
            <button 
              onClick={simulateTrigger}
              className="w-full py-3 rounded-2xl font-bold text-sm bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-all"
            >
              Simulate Trigger Detection
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 px-1">
        <div className={`w-2 h-2 rounded-full animate-pulse ${isTrainingMode ? 'bg-training' : 'bg-success'}`} />
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {isTrainingMode ? 'Simulation' : 'Context Sync'}: {user?.name || 'Guest'} @ {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </span>
      </div>

      {aiMessages.length > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom duration-500">
          <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">
            {isTrainingMode ? 'Coach Feedback' : 'AI Reassurance Messages'}
          </h4>
          <div className="space-y-2">
            {aiMessages.map((msg) => (
              <div key={msg.id} className={`p-4 rounded-2xl rounded-tl-none shadow-lg max-w-[90%] relative text-info-foreground 
                ${isTrainingMode ? 'bg-training' : 'bg-info'}`}>
                <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                <span className="text-[8px] opacity-60 absolute bottom-1 right-3">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest">System Activity</h4>
        <div className="bg-secondary rounded-xl p-3 h-24 overflow-y-auto font-mono text-[10px] text-muted-foreground space-y-1">
          {debugLog.length === 0 ? (
            <div className="text-muted-foreground/50 italic">No activity logs...</div>
          ) : (
            debugLog.map((l, i) => <div key={i}>{`> ${l}`}</div>)
          )}
        </div>
      </div>

      <div className="p-4 bg-secondary border border-border rounded-2xl">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-muted-foreground shrink-0" />
          <div className="text-[10px] text-muted-foreground leading-relaxed italic">
            {isTrainingMode 
              ? 'Training mode helps calibrate the AI to your environment and vocal tone. Try practicing in different noisy conditions.'
              : 'AeroAbantu Guardian AI utilizes real-time speech processing. Stay in a well-lit network area for optimal response times.'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISettings;
