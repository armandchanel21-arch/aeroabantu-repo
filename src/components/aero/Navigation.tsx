import React from 'react';
import { AppMode } from '@/types/aero';
import { Map, Users, Mic, User } from 'lucide-react';

interface NavigationProps {
  activeMode: AppMode;
  setMode: (mode: AppMode) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeMode, setMode }) => {
  const tabs = [
    { mode: AppMode.MAP, label: 'Map', icon: Map },
    { mode: AppMode.CONTACTS, label: 'Contacts', icon: Users },
    { mode: AppMode.AI_SETTINGS, label: 'AI Voice', icon: Mic },
    { mode: AppMode.PROFILE, label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="flex justify-around items-center px-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.mode}
              onClick={() => setMode(tab.mode)}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeMode === tab.mode ? 'text-emergency scale-110' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[9px] font-black uppercase tracking-tighter">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
