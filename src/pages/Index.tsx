import React, { useState, useEffect, useCallback } from 'react';
import { AppMode, Contact, User, LiveSharingState } from '@/types/aero';
import MapView from '@/components/aero/MapView';
import SOSButton from '@/components/aero/SOSButton';
import ContactsList from '@/components/aero/ContactsList';
import AISettings from '@/components/aero/AISettings';
import Auth from '@/components/aero/Auth';
import Navigation from '@/components/aero/Navigation';
import AlertModal from '@/components/aero/AlertModal';
import Profile from '@/components/aero/Profile';
import AeroIcon from '@/components/aero/AeroIcon';
import { Sun, Moon } from 'lucide-react';

const Index = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.AUTH);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('aero-theme');
    return saved === 'dark';
  });

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('aero-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const savedContacts = localStorage.getItem('aero-contacts');
    return savedContacts ? JSON.parse(savedContacts) : [
      { id: '1', name: 'Emergency Dispatch', phone: '911', email: 'sos@aeroabantu.com', isEmergency: true, isVerified: true }
    ];
  });

  const [sharingState, setSharingState] = useState<LiveSharingState>({
    isActive: false,
    sharedWithIds: [],
    expiresAt: null
  });

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [isAIListening, setIsAIListening] = useState(false);

  useEffect(() => {
    localStorage.setItem('aero-theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('aero-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('aero-user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('aero-contacts', JSON.stringify(contacts));
  }, [contacts]);

  // Simulate moving contacts around if they are "live"
  useEffect(() => {
    if (!location) return;

    // Initially place contacts near the user if they don't have a location
    setContacts(prev => prev.map(c => {
      if (!c.lastKnownLocation && c.isVerified && c.id !== '1') {
        return {
          ...c,
          lastKnownLocation: {
            lat: location.lat + (Math.random() - 0.5) * 0.01,
            lng: location.lng + (Math.random() - 0.5) * 0.01,
            timestamp: Date.now()
          }
        };
      }
      return c;
    }));

    const interval = setInterval(() => {
      setContacts(prev => prev.map(c => {
        if (c.lastKnownLocation && c.isVerified && c.id !== '1') {
          return {
            ...c,
            lastKnownLocation: {
              lat: c.lastKnownLocation.lat + (Math.random() - 0.5) * 0.0005,
              lng: c.lastKnownLocation.lng + (Math.random() - 0.5) * 0.0005,
              timestamp: Date.now()
            }
          };
        }
        return c;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [location === null]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      (err) => console.error("Location error:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Check for sharing expiration
  useEffect(() => {
    if (!sharingState.isActive || !sharingState.expiresAt) return;

    const interval = setInterval(() => {
      if (Date.now() > (sharingState.expiresAt as number)) {
        setSharingState({ isActive: false, sharedWithIds: [], expiresAt: null });
        if (window.navigator.vibrate) window.navigator.vibrate(200);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sharingState]);

  const triggerSOS = useCallback(() => {
    setIsSOSActive(true);
    console.log("SOS TRIGGERED! Alerts sent to:", contacts.filter(c => c.isEmergency && c.isVerified));
    
    if (window.navigator.vibrate) {
      window.navigator.vibrate([500, 200, 500, 200, 500]);
    }
  }, [contacts]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setMode(AppMode.MAP);
  };

  const handleLogout = () => {
    setUser(null);
    setMode(AppMode.AUTH);
  };

  if (mode === AppMode.AUTH && !user) {
    return <Auth onLogin={handleLogin} />;
  }

  if (mode === AppMode.AUTH && user) {
    setMode(AppMode.MAP);
  }

  return (
    <div className={`flex flex-col h-screen relative overflow-hidden bg-background transition-colors duration-300`}>
      <header className="bg-card px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 shadow-sm z-10 flex justify-between items-center shrink-0 border-b border-border transition-colors">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-1.5 rounded-xl shadow-md transition-colors">
            <AeroIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-base font-black text-foreground tracking-[0.1em] uppercase">
            AERO<span className="text-emergency">ABANTU</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {sharingState.isActive && (
            <div className="flex items-center gap-1.5 bg-success/10 px-3 py-1.5 rounded-full border border-success/20 shadow-sm">
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-success uppercase tracking-widest">Live Sharing</span>
            </div>
          )}
          {isAIListening && (
            <div className="flex items-center gap-2 bg-info/10 px-3 py-1.5 rounded-full border border-info/20 shadow-sm">
              <div className="flex gap-0.5 items-center h-2">
                <div className="w-0.5 h-full bg-info animate-audio-wave" />
                <div className="w-0.5 h-3 bg-info animate-audio-wave-delay" />
              </div>
              <span className="text-[8px] font-black text-info uppercase tracking-widest">Guardian</span>
            </div>
          )}
          
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        {mode === AppMode.MAP && (
          <div className="h-full w-full">
            <MapView 
              userLocation={location} 
              contacts={contacts} 
              sharingState={sharingState}
              setSharingState={setSharingState}
            />
            <div className="absolute bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-20">
              <SOSButton onTrigger={triggerSOS} />
            </div>
          </div>
        )}

        {mode === AppMode.CONTACTS && (
          <div className="h-full overflow-y-auto bg-background p-4 pb-32 transition-colors">
            <ContactsList contacts={contacts} setContacts={setContacts} />
          </div>
        )}

        {mode === AppMode.AI_SETTINGS && (
          <div className="h-full overflow-y-auto bg-background p-4 pb-32 transition-colors">
            <AISettings 
              isListening={isAIListening} 
              setIsListening={setIsAIListening} 
              onSOSDetected={triggerSOS} 
              user={user}
            />
          </div>
        )}

        {mode === AppMode.PROFILE && (
          <div className="h-full overflow-y-auto bg-background p-4 pb-32 transition-colors">
            <Profile 
              user={user} 
              setUser={setUser} 
              onLogout={handleLogout} 
            />
          </div>
        )}
      </main>

      <Navigation activeMode={mode} setMode={setMode} />
      {isSOSActive && <AlertModal onClose={() => setIsSOSActive(false)} />}
    </div>
  );
};

export default Index;
